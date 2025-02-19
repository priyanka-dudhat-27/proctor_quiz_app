import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { quizService } from "../services/apiServices";
import CustomButton from "../components/CustomButton";
import { motion } from "framer-motion";

const QuizDetails = () => {
  const { quizId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const quizContainerRef = useRef(null);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [terminated, setTerminated] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response);
        const durationInSeconds = response.duration ? response.duration * 60 : 120; // Set default to 2 minutes (120 seconds)
        setTimeLeft(durationInSeconds);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching quiz details:", error);
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings((prevWarnings) => prevWarnings + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (warnings >= 3) {
      setTerminated(true);
    }
  }, [warnings]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        setWarnings((prevWarnings) => prevWarnings + 1);
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, []);

  useEffect(() => {
    let timer;
    if (started && timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [started, timeLeft, submitted]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const requestFullScreen = () => {
    if (quizContainerRef.current) {
      if (quizContainerRef.current.requestFullscreen) {
        quizContainerRef.current.requestFullscreen();
      } else if (quizContainerRef.current.mozRequestFullScreen) { // Firefox
        quizContainerRef.current.mozRequestFullScreen();
      } else if (quizContainerRef.current.webkitRequestFullscreen) { // Chrome, Safari, Opera
        quizContainerRef.current.webkitRequestFullscreen();
      } else if (quizContainerRef.current.msRequestFullscreen) { // IE/Edge
        quizContainerRef.current.msRequestFullscreen();
      }
    } else {
      console.error("quizContainerRef is null. Fullscreen mode cannot be activated.");
    }
  };

  const handleStartQuiz = () => {
    requestFullScreen();
    setStarted(true);
  };

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

  if (terminated) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-red-600 mb-8">Quiz Terminated</h2>
        <p className="text-lg text-gray-600">You have switched tabs too many times or exited full-screen mode. The quiz has been terminated.</p>
        <CustomButton text="Back to Home" onClick={() => navigate("/")} bgColor="bg-blue-500" hoverColor="hover:bg-blue-600" />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Quiz Instructions</h2>
        <p className="text-lg text-gray-600 mb-4">Please read the following instructions carefully before starting the quiz:</p>
        <ul className="list-disc list-inside text-gray-600 mb-8">
          <li>Ensure you are in a quiet environment with no distractions.</li>
          <li>The quiz will be conducted in full-screen mode. Exiting full-screen mode will result in termination of the quiz.</li>
          <li>You will receive warnings if you switch tabs or exit full-screen mode. After 3 warnings, the quiz will be terminated.</li>
          <li>Make sure your internet connection is stable.</li>
        </ul>
        <CustomButton text="Start Quiz" onClick={handleStartQuiz} bgColor="bg-green-500" hoverColor="hover:bg-green-600" />
      </div>
    );
  }

  return (
    <motion.div ref={(el) => (quizContainerRef.current = el)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white p-6 flex flex-col items-center relative">
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

      {warnings > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 w-full max-w-2xl">
          <p className="font-bold">Warning</p>
          <p>You have switched tabs or exited full-screen mode. This is warning {warnings} of 3.</p>
        </div>
      )}

      {started && (
        <div className="mb-4 text-right">
          <span className={`font-bold text-lg ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : ''}`}>
            Time Left: {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {submitted ? (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-6 rounded-lg shadow-lg text-center z-10">
          <h3 className="text-2xl font-semibold text-gray-700">Thank You for Submitting the Quiz!</h3>
          <p className="text-lg text-gray-600 mt-2">Your instructor will inform you of your score.</p>
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
