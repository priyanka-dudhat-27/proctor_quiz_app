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

    // Validate answers array
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ 
        message: "Invalid answers format. Number of answers must match number of questions." 
      });
    }

    let score = 0;
    const questionResults = quiz.questions.map((question, index) => {
      const isCorrect = question.correctAnswer === answers[index];
      if (isCorrect) score++;
      return {
        questionNumber: index + 1,
        userAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const totalQuestions = quiz.questions.length;
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= 60;

    const attempt = new Attempt({ 
      user: req.user.id, 
      quiz: quiz._id, 
      score,
      totalQuestions,
      percentage,
      passed,
      answers: questionResults
    });
    
    await attempt.save();

    res.json({ 
      message: passed ? "Congratulations! You passed the quiz!" : "Quiz completed. Keep practicing!",
      score,
      totalQuestions,
      percentage: percentage.toFixed(2),
      passed,
      questionResults
    });
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

    const attempts = await Attempt.find()
      .populate("quiz", "title questions")
      .populate("user", "name")
      .sort({ createdAt: -1 }); // Sort by most recent first

    const scores = attempts.map(attempt => ({
      _id: attempt._id,
      userName: attempt.user.name,
      quizTitle: attempt.quiz.title,
      marks: attempt.score,
      totalMarks: attempt.totalQuestions,
      percentage: attempt.percentage,
      passed: attempt.passed,
      attemptedAt: attempt.createdAt,
      answers: attempt.answers
    }));

    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteScore = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const scoreId = req.params.id;
    const deletedScore = await Attempt.findByIdAndDelete(scoreId);

    if (!deletedScore) {
      return res.status(404).json({ message: "Score not found" });
    }

    res.json({ message: "Score deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
