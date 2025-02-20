import React, { useEffect, useState } from 'react';
import { quizService } from '../services/apiServices';
import { motion } from 'framer-motion';

const AdminMonitoring = () => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [multiView, setMultiView] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    setWs(ws);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'userConnected':
          setActiveStreams(prev => [...prev, {
            userId: message.userId,
            status: 'active',
            lastPing: new Date()
          }]);
          break;
        case 'userDisconnected':
          setActiveStreams(prev => prev.filter(stream => stream.userId !== message.userId));
          break;
        default:
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await quizService.getActiveUsers();
        setActiveUsers(response.data);
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };

    const interval = setInterval(() => {
      fetchActiveUsers();
    }, 5000);
    fetchActiveUsers();

    return () => clearInterval(interval);
  }, []);

  const filteredUsers = activeUsers.filter(user =>
    user.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchActivityLogs(user.userId);
    fetchAnalytics(user.userId);
  };

  const handleAddToMultiView = (userId) => {
    if (!multiView.includes(userId)) {
      setMultiView([...multiView, userId]);
    }
  };

  const fetchActivityLogs = async (userId) => {
    try {
      const response = await quizService.getActivityLogs(userId);
      setActivityLogs(response.data);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const fetchAnalytics = async (userId) => {
    try {
      const response = await quizService.getUserAnalytics(userId);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const startRecording = async (userId) => {
    try {
      await quizService.startRecording(userId);
      setShowRecordModal(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Live Camera Monitoring</h1>
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow p-2 border rounded-lg"
        />
        <button
          onClick={() => setShowRecordModal(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Start Recording
        </button>
      </div>
      {multiView.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Multi-Camera View</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {multiView.map(userId => (
              <div key={userId} className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <video
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                  src={`ws://localhost:8080/stream?userId=${userId}`}
                />
                <button
                  onClick={() => setMultiView(multiView.filter(id => id !== userId))}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeStreams.map(stream => (
          <motion.div
            key={stream.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="relative aspect-video bg-gray-200">
              <video
                autoPlay
                muted
                className="w-full h-full object-cover"
                src={`ws://localhost:8080/stream?userId=${stream.userId}`}
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-sm"
                style={{ backgroundColor: stream.status === 'active' ? '#10B981' : '#EF4444' }}
              >
                {stream.status}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">User ID: {stream.userId}</h3>
              <p className="text-sm text-gray-600">
                Last activity: {new Date(stream.lastPing).toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">User Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">User ID:</h3>
                <p>{selectedUser.userId}</p>
              </div>
              <div>
                <h3 className="font-semibold">Status:</h3>
                <p>{selectedUser.status}</p>
              </div>
              <div>
                <h3 className="font-semibold">Last Activity:</h3>
                <p>{new Date(selectedUser.lastPing).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-semibold">Warnings:</h3>
                <p>{selectedUser.warnings || 0}</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Recent Activities:</h3>
              <div className="max-h-48 overflow-y-auto">
                {activityLogs.map((log, index) => (
                  <div key={index} className="p-2 border-b">
                    <p className="text-sm">{new Date(log.timestamp).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Session Analytics:</h3>
              {analytics && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Focus Percentage</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${analytics.focusPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Activity Level</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${analytics.activityLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => startRecording(selectedUser.userId)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Record Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoring;
