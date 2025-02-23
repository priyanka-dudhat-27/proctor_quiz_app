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
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);
    setWs(ws);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case 'activeUsers':
          setActiveUsers(message.users);
          break;// Add these state variables at the top
          const [peerConnections, setPeerConnections] = useState(new Map());
          const [localStream, setLocalStream] = useState(null);
          
          // Add this function to handle WebRTC connection
          const setupPeerConnection = async (userId) => {
            const configuration = {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
              ]
            };
            
            const pc = new RTCPeerConnection(configuration);
            
            pc.ontrack = (event) => {
              const videoElement = document.getElementById(`video-${userId}`);
              if (videoElement && event.streams[0]) {
                videoElement.srcObject = event.streams[0];
              }
            };
          
            // Handle ICE candidates
            pc.onicecandidate = (event) => {
              if (event.candidate) {
                ws.send(JSON.stringify({
                  type: 'candidate',
                  candidate: event.candidate,
                  targetUserId: userId
                }));
              }
            };
          
            peerConnections.set(userId, pc);
            setPeerConnections(new Map(peerConnections));
            
            return pc;
          };
          
          // Update the WebSocket message handler
          ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
              case 'offer':
                const pc = await setupPeerConnection(message.senderUserId);
                await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(JSON.stringify({
                  type: 'answer',
                  answer,
                  targetUserId: message.senderUserId
                }));
                break;
              case 'answer':
                const peerConnection = peerConnections.get(message.senderUserId);
                if (peerConnection) {
                  await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
                }
                break;
              case 'candidate':
                const pc2 = peerConnections.get(message.senderUserId);
                if (pc2) {
                  await pc2.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
                break;
              // ... existing cases
            }
          };
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

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, []);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await quizService.getActiveUsers();
        setActiveUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };

    // Initial fetch
    fetchActiveUsers();
  }, []);

  const filteredUsers = activeUsers?.filter(user =>
    user?.userId?.toLowerCase().includes(searchQuery?.toLowerCase() || '')
  ) || [];

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
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          className="w-full p-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Multi-camera View */}
      {multiView.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Multi-camera View</h2>
            <button
              onClick={() => setMultiView([])}
              className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
            >
              Clear All
            </button>
          </div>
          <div className={`grid gap-4 ${
            multiView.length === 1 ? 'grid-cols-1' :
            multiView.length === 2 ? 'grid-cols-2' :
            multiView.length === 3 ? 'grid-cols-3' :
            'grid-cols-2 md:grid-cols-4'
          }`}>
            {multiView.map((userId) => {
              const user = activeUsers?.find(u => u.userId === userId);
              return (
                <div key={userId} className="relative bg-gray-100 rounded-lg p-4">
                  <button
                    onClick={() => setMultiView(prev => prev.filter(id => id !== userId))}
                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="aspect-video bg-gray-800 rounded-lg mb-2">
                    {/* Video stream would go here */}
                    <div className="w-full h-full flex items-center justify-center text-white">
                      Stream: {user?.userId}
                    </div>
                  </div>
                  <p className="text-sm font-medium">{user?.userId}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredUsers.map((user) => (
          <motion.div
            key={user.userId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">{user.userId}</h3>
                <p className="text-sm text-gray-600">Status: {user.status || 'Active'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToMultiView(user.userId)}
                  disabled={multiView.includes(user.userId)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    multiView.includes(user.userId)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {multiView.includes(user.userId) ? 'Added' : 'Add to View'}
                </button>
                <button
                  onClick={() => handleUserClick(user)}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                >
                  Details
                </button>
              </div>
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
