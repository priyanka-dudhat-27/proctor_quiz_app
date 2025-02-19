import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { quizService } from "../services/apiServices";
import CustomButton from "../components/CustomButton";
import { motion } from "framer-motion";

const QuizDetails = () => {
  const { quizId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quiz details:", error);
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setAnswers({ ...answers, [questionIndex]: optionIndex });
  };

  const handleSubmitQuiz = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const formattedAnswers = Object.values(answers); // Convert object to array
      const response = await quizService.submitQuiz(quizId, { answers: formattedAnswers });
      setScore(response.score);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };
  

  if (loading) return <p className="text-center text-gray-700">Loading quiz...</p>;
  if (!quiz) return <p className="text-center text-red-500">Quiz not found</p>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white p-6 flex flex-col items-center relative">
      {/* Background GIF */}
      <motion.img
        src="https://content.presentermedia.com/content/clipart/00015000/15111/student_thinking_300_nwm.jpg" // Replace with your GIF URL
        alt="Background Animation"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
      />

      <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="text-4xl font-bold text-gray-800 mb-6 z-10">
        {quiz.title}
      </motion.h2>

      {submitted ? (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-6 rounded-lg shadow-lg text-center z-10">
          <h3 className="text-2xl font-semibold text-gray-700">Quiz Submitted!</h3>
          <p className="text-lg text-gray-600 mt-2">Your Score: <span className="font-bold">{score}</span></p>
          <CustomButton text="Back to Home" onClick={() => navigate("/")} bgColor="bg-blue-500" hoverColor="hover:bg-blue-600" />
        </motion.div>
      ) : (
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg z-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.questions[currentQuestion].question}</h3>
          <div className="space-y-2">
            {quiz.questions[currentQuestion].options.map((option, optIndex) => (
              <motion.div
                key={optIndex}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-lg cursor-pointer border ${answers[currentQuestion] === optIndex ? "bg-yellow-500 text-white" : "bg-gray-100"}`}
                onClick={() => handleOptionSelect(currentQuestion, optIndex)}
              >
                {option}
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            {currentQuestion > 0 && (
              <CustomButton text="Previous" onClick={() => setCurrentQuestion(currentQuestion - 1)} bgColor="bg-gray-400" hoverColor="hover:bg-gray-500" />
            )}
            {currentQuestion < quiz.questions.length - 1 ? (
              <CustomButton text="Next" onClick={() => setCurrentQuestion(currentQuestion + 1)} bgColor="bg-blue-500" hoverColor="hover:bg-blue-600" />
            ) : (
              <CustomButton text="Submit Quiz" onClick={handleSubmitQuiz} bgColor="bg-green-500" hoverColor="hover:bg-green-600" className="ml-auto" />
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuizDetails;
