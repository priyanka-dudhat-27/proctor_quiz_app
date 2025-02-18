import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { createQuiz, getQuizzes, submitQuiz } from "../controllers/quizController.js";

const router = express.Router();

// ✅ Admin can create a quiz
router.post("/create", protect, admin, createQuiz);

// ✅ Get all quizzes (accessible to all users)
router.get("/", protect, getQuizzes);

// ✅ Submit quiz answers (only logged-in users)
router.post("/submit", protect, submitQuiz);

export default router;
