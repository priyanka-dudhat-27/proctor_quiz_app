import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import setupVideoStream from './socket/videoStream.js';
import quizRoutes from './routes/quizRoutes.js';
const activityRoutes = require('./routes/activityRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const httpServer = createServer(app);

// Setup WebSocket server
const io = setupVideoStream(httpServer);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
