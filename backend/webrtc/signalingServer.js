const WebSocket = require('ws');
const AIProctoring = require('../services/aiProctoring');

class SignalingServer {
  constructor(port) {
    this.server = new WebSocket.Server({ port });
    this.connections = new Map();
    this.setupHandlers();
    AIProctoring.initialize();
  }

  setupHandlers() {
    this.server.on('connection', (ws, req) => {
      const userId = req.url.split('=')[1];
      this.connections.set(userId, ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(userId, data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        this.connections.delete(userId);
        this.broadcastUserDisconnect(userId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      this.broadcastUserConnect(userId);
    });
  }

  broadcastUserConnect(userId) {
    this.server.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'userConnected',
          userId
        }));
      }
    });
  }

  broadcastUserDisconnect(userId) {
    this.server.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'userDisconnected',
          userId
        }));
      }
    });
  }

  handleMessage(userId, data) {
    switch (data.type) {
      case 'offer':
      case 'answer':
      case 'candidate':
        this.forwardMessage(data.targetUserId, {
          ...data,
          senderUserId: userId
        });
        break;
      case 'frame':
        this.handleFrame(userId, data.frame);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  async handleFrame(userId, frame) {
    const alerts = await AIProctoring.detectSuspiciousActivity(frame);
    if (alerts.length > 0) {
      this.sendAlert(userId, alerts);
    }
  }

  sendAlert(userId, alerts) {
    const ws = this.connections.get(userId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'alert',
        alerts
      }));
    }
  }

  forwardMessage(targetUserId, message) {
    const targetWs = this.connections.get(targetUserId);
    if (targetWs) {
      targetWs.send(JSON.stringify(message));
    }
  }
}

module.exports = SignalingServer;
