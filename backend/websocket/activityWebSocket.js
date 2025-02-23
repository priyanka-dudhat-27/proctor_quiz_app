import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

const activeUsers = new Map();

export function setupWebSocketServer(server) {
    const wss = new WebSocketServer({ server, path: "/ws" });

    wss.on('connection', async (ws, req) => {
        try {
            // Extract token from request headers
            const token = new URL(req.headers.origin + req.url).searchParams.get('token');

            if (!token) {
                ws.close(1008, 'Authentication required');
                return;
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;

            // Store user connection
            activeUsers.set(userId, {
                ws,
                lastActive: Date.now(),
                userId,
                name: decoded.name
            });

            console.log(`✅ User connected: ${decoded.name}`);

            // Handle connection close
            ws.on('close', () => {
                activeUsers.delete(userId);
                broadcastActiveUsers();
            });

            // Handle incoming messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'ping') {
                        activeUsers.get(userId).lastActive = Date.now();
                    }
                } catch (err) {
                    console.error("❌ Error parsing WebSocket message:", err);
                }
            });

            // Send initial active users list
            broadcastActiveUsers();
        } catch (error) {
            console.error('❌ WebSocket connection error:', error);
            ws.close(1011, 'Something went wrong');
        }
    });

    // Cleanup inactive users every minute
    setInterval(() => {
        const now = Date.now();
        for (const [userId, user] of activeUsers.entries()) {
            if (now - user.lastActive > 60000) { // 1 minute timeout
                user.ws.close();
                activeUsers.delete(userId);
            }
        }
        broadcastActiveUsers();
    }, 60000);

    function broadcastActiveUsers() {
        const usersList = Array.from(activeUsers.values()).map(({ userId, name, lastActive }) => ({
            userId,
            name,
            lastActive
        }));

        const message = JSON.stringify({
            type: 'activeUsers',
            users: usersList
        });

        for (const user of activeUsers.values()) {
            if (user.ws.readyState === ws.OPEN) {
                user.ws.send(message);
            }
        }
    }

    return {
        getActiveUsers: () => {
            return Array.from(activeUsers.values()).map(({ userId, name, lastActive }) => ({
                userId,
                name,
                lastActive
            }));
        }
    };
}
