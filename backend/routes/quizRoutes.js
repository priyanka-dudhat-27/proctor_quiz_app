import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { createQuiz, getAllQuizzes, submitQuiz, getQuizById } from "../controllers/quizController.js";

const router = express.Router();

router.post("/create-quiz", protect, admin, createQuiz);

router.get("/single-quiz/:id", protect, getQuizById);

router.get("/all", protect, getAllQuizzes);

router.post("/submit", protect, submitQuiz);

export default router;
