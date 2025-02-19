import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { quizService } from "../services/apiServices";

const AdminViewScores = () => {
  const [scores, setScores] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        if (!user || user.role !== "admin") return; // Ensure user is admin before fetching
        const response = await quizService.getAllScores();
        console.log("Fetched Scores:", response);
        setScores(response);
      } catch (error) {
        console.error("Error fetching scores:", error);
        setScores([]);
      }
    };

    fetchScores();
  }, [user]);

  if (!user || user.role !== "admin") {
    return <p className="text-center text-red-500">Access denied</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">All Users' Quiz Scores</h2>

      {scores.length === 0 ? (
        <p className="text-gray-600 text-lg">No scores available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {scores.map((score) => (
            <div
              key={score._id}
              className="bg-white shadow-lg rounded-xl p-6 transform transition duration-300 hover:scale-105 hover:shadow-xl"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{score.quizTitle}</h3>
              <p className="text-gray-600 text-sm mb-4">
                User: <span className="font-bold">{score.userName}</span>
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Score: <span className="font-bold">{score.marks} / {score.totalMarks}</span>
              </p>
              <p className="text-gray-600 text-sm">Attempted on: {new Date(score.attemptedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminViewScores;