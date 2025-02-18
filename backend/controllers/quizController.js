import Quiz from "../models/Quiz.js";
import Attempt from "../models/Attempt.js";

export const createQuiz = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Access Denied" });

    const { title, questions } = req.body;
    const quiz = new Quiz({ title, questions, createdBy: req.user.id });
    await quiz.save();
    
    res.status(201).json(quiz);
};

export const getQuizzes = async (req, res) => {
    const quizzes = await Quiz.find();
    res.json(quizzes);
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
