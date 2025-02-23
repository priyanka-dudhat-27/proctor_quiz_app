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

  // Fix: Move WebRTC-related states to the top
  const [peerConnections, setPeerConnections] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.hostname}:8081/ws?token=${token}`);
    
    ws.onopen = () => console.log("✅ WebSocket Connected");
    ws.onerror = (err) => console.error("❌ WebSocket Error:", err);
    ws.onclose = (event) => console.warn("⚠️ WebSocket Closed:", event);
    
    setWs(ws);
    console.log("ws>>>>",ws)

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'activeUsers':
          setActiveUsers(message.users);
          break;

        case 'userConnected':
          setActiveStreams((prev) => [
            ...prev,
            { userId: message.userId, status: 'active', lastPing: new Date() },
          ]);
          break;

        case 'userDisconnected':
          setActiveStreams((prev) =>
            prev.filter((stream) => stream.userId !== message.userId)
          );
          break;

        // WebRTC Handling
        case 'offer':
          const pc = await setupPeerConnection(message.senderUserId);
          await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(
            JSON.stringify({
              type: 'answer',
              answer,
              targetUserId: message.senderUserId,
            })
          );
          break;

        case 'answer':
          const peerConnection = peerConnections.get(message.senderUserId);
          if (peerConnection) {
            await peerConnection.setRemoteDescription(
              new RTCSessionDescription(message.answer)
            );
          }
          break;

        case 'candidate':
          const pc2 = peerConnections.get(message.senderUserId);
          if (pc2) {
            await pc2.addIceCandidate(new RTCIceCandidate(message.candidate));
          }
          break;

        default:
          break;
      }
    };

    // Ping WebSocket to keep connection alive
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

  // WebRTC Setup Function
  const setupPeerConnection = async (userId) => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    const pc = new RTCPeerConnection(configuration);

    pc.ontrack = (event) => {
      const videoElement = document.getElementById(`video-${userId}`);
      if (videoElement && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(
          JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
            targetUserId: userId,
          })
        );
      }
    };

    // Fix: Properly update the peerConnections state
    setPeerConnections((prev) => {
      const updatedMap = new Map(prev);
      updatedMap.set(userId, pc);
      return updatedMap;
    });

    return pc;
  };

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await quizService.getActiveUsers();
        if (response.data && Array.isArray(response.data.users)) {
          setActiveUsers(response.data.users);
        } else {
          setActiveUsers([]);
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
        setActiveUsers([]); // Prevent undefined issues
      }
    };
  
    fetchActiveUsers();
  }, []);
  

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Admin Monitoring</h2>

      {/* Active Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {activeUsers?.length > 0 ? (
  activeUsers.map((user) => (
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
        <button
          onClick={() => console.log(`Monitoring ${user.userId}`)}
          className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
        >
          Monitor
        </button>
      </div>
    </motion.div>
  ))
) : (
  <p>No active users available.</p>
)}

      </div>
    </div>
  );
};

export default AdminMonitoring;
