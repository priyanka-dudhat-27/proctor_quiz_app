import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import proctoringRoutes from "./routes/proctoringRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { handleCameraStream } from "./controllers/proctoringController.js";
import { WebSocketServer,WebSocket } from "ws"; // ✅ WebSocket Server Import
import jwt from "jsonwebtoken";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/proctoring", proctoringRoutes);
app.use("/api/activity", activityRoutes);

// Create HTTP Server
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Handle Camera Stream (Socket.io)
handleCameraStream(io);

// WebSocket Server for Active User Monitoring
const wss = new WebSocketServer({ server, path: "/ws" });
const activeUsers = new Map();

// Function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("⚠️ Token expired.");
      return null;
    }
    throw error;
  }
};

wss.on("connection", async (ws, req) => {
  try {
    // Extract token from URL
    const token = new URL(req.headers.origin + req.url).searchParams.get("token");

    if (!token) {
      ws.close(1008, "Authentication required");
      return;
    }

    let decoded = verifyToken(token);
    
    if (!decoded) {
      ws.send(JSON.stringify({ type: "tokenExpired", message: "Your session has expired, please reauthenticate." }));
      ws.close();
      return;
    }

    const userId = decoded.id;

    // Store user connection
    activeUsers.set(userId, {
      ws,
      lastActive: Date.now(),
      userId,
      name: decoded.role,
    });

    console.log(`✅ User connected: ${decoded.id}`);

    // Handle connection close
    ws.on("close", () => {
      activeUsers.delete(userId);
      broadcastActiveUsers();
    });

    // Handle incoming messages
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "ping") {
          const user = activeUsers.get(userId);
          if (user) {
            user.lastActive = Date.now();
          }
        }
      } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err);
      }
    });

    // Send initial active users list
    broadcastActiveUsers();
  } catch (error) {
    console.error("❌ WebSocket connection error:", error);
    ws.close(1011, "Something went wrong");
  }
});

// Cleanup inactive users every minute
setInterval(() => {
  const now = Date.now();
  for (const [userId, user] of activeUsers.entries()) {
    if (now - user.lastActive > 60000) {
      // 1-minute timeout
      user.ws.close();
      activeUsers.delete(userId);
    }
  }
  broadcastActiveUsers();
}, 60000);

// Broadcast Active Users
function broadcastActiveUsers() {
  const usersList = Array.from(activeUsers.values()).map(
    ({ userId, name, lastActive }) => ({
      userId,
      name,
      lastActive,
    })
  );

  const message = JSON.stringify({
    type: "activeUsers",
    users: usersList,
  });

  for (const user of activeUsers.values()) {
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(message);
    }
  }
}

// Start Server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () =>
  console.log(
    `🚀 Server running on port ${PORT}, WebSocket on ws://localhost:${PORT}/ws`
  )
);
