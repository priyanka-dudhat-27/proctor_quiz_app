import { Server } from 'socket.io';

const setupVideoStream = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('video-frame', (data) => {
      // Broadcast the frame to all admin clients
      socket.broadcast.emit('video-frame', data);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

export default setupVideoStream;
