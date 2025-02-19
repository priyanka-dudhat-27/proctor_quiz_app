import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import CustomButton from "../components/CustomButton";
import { quizService } from "../services/apiServices";

const Home = () => {
  const [quizzes, setQuizzes] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await quizService.getAllQuizzes();
        console.log("API Response:", response.data);
        if (Array.isArray(response.data)) {
          setQuizzes(response.data);
        } else {
          setQuizzes([]);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        setQuizzes([]);
      }
    };

    fetchQuizzes();
  }, []);

  const handleAttendQuiz = async (quizId) => {
    try {
      const quiz = await quizService.getQuizById(quizId);
      console.log("Quiz Details:", quiz);
      if (user) {
      navigate(`/specific-quiz/${quizId}`);
        } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Error fetching quiz details:", error);
    }

  };
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Available Quizzes</h2>

      {quizzes.length === 0 ? (
        <p className="text-gray-600 text-lg">No quizzes available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-white shadow-lg rounded-xl p-6 transform transition duration-300 hover:scale-105 hover:shadow-xl"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{quiz.title}</h3>
              <p className="text-gray-600 text-sm mb-4">
                Created by: <span className="font-medium">{quiz.createdBy?.name || "Unknown"}</span>
              </p>

              <CustomButton
                text="Attend Quiz"
                onClick={() => handleAttendQuiz(quiz._id)}
                bgColor="bg-blue-500"
                hoverColor="hover:bg-blue-600"
                className="w-full py-2 text-lg"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
