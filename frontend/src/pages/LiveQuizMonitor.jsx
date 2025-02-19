import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

const LiveQuizMonitor = () => {
  const { user } = useContext(AuthContext);
  const [activeStreams, setActiveStreams] = useState({});
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('video-frame', ({ userId, userName, quizId, frame }) => {
      setActiveStreams(prev => ({
        ...prev,
        [userId]: {
          userName,
          quizId,
          frame,
          lastUpdate: new Date()
        }
      }));
    });

    // Clean up inactive streams every 5 seconds
    const cleanup = setInterval(() => {
      const now = new Date();
      setActiveStreams(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(userId => {
          if (now - new Date(updated[userId].lastUpdate) > 5000) {
            delete updated[userId];
          }
        });
        return updated;
      });
    }, 5000);

    return () => {
      newSocket.disconnect();
      clearInterval(cleanup);
    };
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <p className="text-center text-red-500 text-xl mt-8">Access denied</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Live Quiz Monitor</h2>
          
          {Object.keys(activeStreams).length === 0 ? (
            <p className="text-center text-gray-600 text-lg py-8">No active quiz sessions</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(activeStreams).map(([userId, { userName, quizId, frame }]) => (
                <div key={userId} className="bg-white border rounded-lg shadow-md overflow-hidden">
                  <div className="aspect-w-4 aspect-h-3">
                    <img 
                      src={frame} 
                      alt={`Stream of ${userName}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800">{userName}</h3>
                    <p className="text-sm text-gray-500">Quiz ID: {quizId}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Live
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveQuizMonitor;
