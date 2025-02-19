import Quiz from "../models/Quiz.js";
import Attempt from "../models/Attempt.js";

export const createQuiz = async (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access Denied" });
    }

    try {
        const { title, questions } = req.body;

        if (!title || !questions.length) {
            return res.status(400).json({ message: "Title and questions are required" });
        }

        const quiz = new Quiz({ title, questions, createdBy: req.user.id });
        await quiz.save();
        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate("createdBy", "name");
    res.status(200).json(Array.isArray(quizzes) ? quizzes : []);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  const { quizId, answers } = req.body;
  const quiz = await Quiz.findById(quizId);

  let score = 0;
  quiz.questions.forEach((q, i) => {
    if (q.correctAnswer === answers[i]) score++;
  });

  const attempt = new Attempt({ user: req.user.id, quiz: quizId, score });
  await attempt.save();

  res.json({ message: "Quiz completed!", score });
};