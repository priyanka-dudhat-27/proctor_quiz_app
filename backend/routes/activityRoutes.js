import express from 'express';
import { getActivityLogs } from '../controllers/activityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:userId').get(protect, admin, getActivityLogs);

// Get active users
router.get('/active-users', protect, (req, res) => {
    const webSocketServer = req.app.get('webSocketServer');
    if (!webSocketServer) {
        return res.status(500).json({ message: 'WebSocket server not initialized' });
    }
    const activeUsers = webSocketServer.getActiveUsers();
    res.json({ users: activeUsers });
});

export default router;