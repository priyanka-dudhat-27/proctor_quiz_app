import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { quizService } from "../services/apiServices";
import CustomButton from "../components/CustomButton";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

const QuizDetails = () => {
  const { quizId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const quizContainerRef = useRef(null);
  const videoRef = useRef(null);
  const socketRef = useRef(null);

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
  const [stream, setStream] = useState(null);

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io("http://localhost:5000");

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 320,
          height: 240,
          frameRate: { ideal: 10, max: 15 }
        },
        audio: false 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Start sending video frames to server
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      
      const sendFrame = () => {
        if (videoRef.current && socketRef.current) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL('image/jpeg', 0.5);
          socketRef.current.emit('video-frame', {
            userId: user.id,
            userName: user.name,
            quizId: quizId,
            frame
          });
        }
      };

      // Send frames every 1 second
      const frameInterval = setInterval(sendFrame, 1000);
      return () => clearInterval(frameInterval);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      setTerminated(true);
    }
  };

  const handleStartQuiz = async () => {
    try {
      await startWebcam();
      await requestFullScreen();
      setStarted(true);
    } catch (error) {
      console.error("Error starting quiz:", error);
    }
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
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow-lg rounded-3xl sm:p-10">
            <div className="max-w-md mx-auto">
              <div className="text-center">
                <div className="mb-8">
                  <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h2 className="text-3xl font-bold text-red-600 mb-4">Quiz Terminated</h2>
                
                <div className="bg-red-50 p-4 rounded-lg mb-6">
                  <p className="text-lg text-red-800 mb-4">
                    Your quiz has been terminated due to one of the following reasons:
                  </p>
                  <ul className="text-red-700 text-left space-y-2">
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Exiting full-screen mode</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Switching browser tabs</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Receiving three warnings</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Webcam access is required to take the quiz</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => navigate("/")}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow-lg rounded-3xl sm:p-10">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <div className="flex items-center justify-center mb-8">
                    <h2 className="text-3xl font-bold text-indigo-600">Quiz Instructions</h2>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <p className="text-lg text-blue-800 mb-4">
                      Please read carefully:
                    </p>
                    <ul className="list-none space-y-3">
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Ensure you are in a quiet environment with no distractions</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>The quiz will be conducted in full-screen mode</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Three warnings will result in quiz termination</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Make sure your internet connection is stable</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Webcam access is required to take the quiz</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-800 font-medium mb-2">Important Notes:</p>
                    <ul className="list-disc list-inside text-yellow-700 space-y-2">
                      <li>Quiz duration: {quiz.duration} minutes</li>
                      <li>Auto-submission when time expires</li>
                      <li>No tab switching allowed</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 text-base leading-6 font-bold sm:text-lg sm:leading-7">
                  <div className="flex justify-center">
                    <button
                      onClick={handleStartQuiz}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Start Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed top-4 right-4 w-[160px] h-[120px] bg-black rounded-lg overflow-hidden shadow-lg"
      />
    </motion.div>
  );
};

export default QuizDetails;
