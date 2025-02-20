import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { createQuiz, getAllQuizzes, submitQuiz, getQuizById, getAllScores, deleteScore } from "../controllers/quizController.js";

const router = express.Router();

router.post("/create-quiz", protect, admin, createQuiz);

router.get("/single-quiz/:id", protect, getQuizById);

router.get("/all", getAllQuizzes);

router.post("/submit/:id", protect, submitQuiz);

router.get("/admin/scores", protect, getAllScores);

router.delete("/admin/scores/:id", protect, admin, deleteScore);

export default router;
