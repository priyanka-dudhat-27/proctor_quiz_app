import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const AdminMonitoring = () => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [peerConnections, setPeerConnections] = useState(new Map());
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    const connectWebSocket = () => {
      wsRef.current = new WebSocket(`${protocol}://${window.location.hostname}:8081/ws?token=${token}`);
      const ws = wsRef.current;

      ws.onopen = () => {
        console.log("✅ WebSocket Connected");
        reconnectAttempts.current = 0; // Reset reconnect attempts
      };

      ws.onerror = (err) => console.error("❌ WebSocket Error:", err);

      ws.onclose = () => {
        console.warn("⚠️ WebSocket Disconnected");
        reconnectAttempts.current++;
        const delay = Math.min(3000 * reconnectAttempts.current, 30000); // Exponential backoff (max 30s)
        setTimeout(connectWebSocket, delay);
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'activeUsers':
            setActiveUsers(message.users || []);
            break;

          case 'userDisconnected':
            removePeerConnection(message.userId);
            setActiveUsers((prev) => prev.filter((user) => user.userId !== message.userId));
            break;

          case 'offer':
            const pc = await setupPeerConnection(message.senderUserId);
            await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', answer, targetUserId: message.senderUserId }));
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

          default:
            break;
        }
      };
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const setupPeerConnection = useCallback(async (userId) => {
    if (peerConnections.has(userId)) return peerConnections.get(userId);

    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const pc = new RTCPeerConnection(configuration);

    pc.ontrack = (event) => {
      const videoElement = document.getElementById(`video-${userId}`);
      if (videoElement && event.streams[0]) {
        videoElement.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate, targetUserId: userId }));
      }
    };

    setPeerConnections((prev) => {
      const newMap = new Map(prev);
      newMap.set(userId, pc);
      return newMap;
    });

    return pc;
  }, [peerConnections]);

  const removePeerConnection = (userId) => {
    const pc = peerConnections.get(userId);
    if (pc) {
      pc.close();
      setPeerConnections((prev) => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    }
  };

  const requestMonitoring = (userId) => {
    wsRef.current.send(JSON.stringify({ type: 'startMonitoring', targetUserId: userId }));
    console.log(`Monitoring requested for ${userId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Admin Monitoring</h2>
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
                  onClick={() => requestMonitoring(user.userId)}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600"
                >
                  Monitor
                </button>
              </div>
              <video id={`video-${user.userId}`} autoPlay playsInline className="w-full h-40 bg-black rounded-lg"></video>
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
