import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import proctoringRoutes from "./routes/proctoringRoutes.js";
import { Server } from "socket.io";
import { createServer } from "http";
import { handleCameraStream } from "./controllers/proctoringController.js";

dotenv.config();
connectDB()

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/proctoring", proctoringRoutes);

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

handleCameraStream(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
