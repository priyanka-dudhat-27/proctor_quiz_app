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
    res.status (500).json({ message: "Server error", error: error.message });
  }
};

export const submitQuiz = async (req, res, next) => {
  const { id } = req.params;
  const { answers } = req.body;

  try {
    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({ message: "Quiz has no questions" });
    }

    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (question.correctAnswer === answers[index]) {
        score++;
      }
    });

    const attempt = new Attempt({ user: req.user.id, quiz: quiz._id, score });
    await attempt.save();

    res.json({ message: "Quiz completed!", score });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllScores = async (req, res, next) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const attempts = await Attempt.find().populate("quiz", "title").populate("user", "name");
    const scores = attempts.map(attempt => ({
      _id: attempt._id,
      userName: attempt.user.name,
      quizTitle: attempt.quiz.title,
      marks: attempt.score,
      totalMarks: attempt.quiz.questions.length,
      attemptedAt: attempt.createdAt,
    }));

    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
