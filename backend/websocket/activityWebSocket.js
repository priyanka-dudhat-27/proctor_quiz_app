const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const activeUsers = new Map();

function setupWebSocketServer(server) {
    const wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', async (ws, req) => {
        try {
            // Extract token from query parameters
            const url = new URL(req.url, 'ws://localhost:8080');
            const token = url.searchParams.get('token');

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

            // Handle connection close
            ws.on('close', () => {
                activeUsers.delete(userId);
                broadcastActiveUsers();
            });

            // Handle incoming messages
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                if (data.type === 'ping') {
                    activeUsers.get(userId).lastActive = Date.now();
                }
            });

            // Send initial active users list
            broadcastActiveUsers();
        } catch (error) {
            console.error('WebSocket connection error:', error);
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
            if (user.ws.readyState === WebSocket.OPEN) {
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

module.exports = setupWebSocketServer;
