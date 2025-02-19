import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { quizService } from "../services/apiServices";
import CustomButton from "../components/CustomButton";

const QuizDetails = () => {
  const { quizId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    const fetchQuizDetails = async (quizId) => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
        console.log("Quiz Details:",response.data);
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
      const response = await quizService.submitQuiz(quizId, { answers });
      setScore(response.data.score);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  if (loading) return <p className="text-center text-gray-700">Loading quiz...</p>;
  if (!quiz) return <p className="text-center text-red-500">Quiz not found</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">{quiz.title}</h2>

      {submitted ? (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
          <h3 className="text-2xl font-semibold text-gray-700">Quiz Submitted!</h3>
          <p className="text-lg text-gray-600 mt-2">Your Score: <span className="font-bold">{score}</span></p>
          <CustomButton text="Back to Home" onClick={() => navigate("/")} bgColor="bg-blue-500" hoverColor="hover:bg-blue-600" />
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
          {quiz.questions.map((q, index) => (
            <div key={index} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{q.question}</h3>
              <div className="space-y-2">
                {q.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={`p-3 rounded-lg cursor-pointer border ${
                      answers[index] === optIndex ? "bg-blue-500 text-white" : "bg-gray-100"
                    }`}
                    onClick={() => handleOptionSelect(index, optIndex)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <CustomButton text="Submit Quiz" onClick={handleSubmitQuiz} bgColor="bg-green-500" hoverColor="hover:bg-green-600" />
        </div>
      )}
    </div>
  );
};

export default QuizDetails;
