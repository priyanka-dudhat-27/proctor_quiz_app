import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const { user, logoutUser } = useContext(AuthContext);

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">  🏆 Quiz App</Link>

        <nav className="flex space-x-4">
          {user ? (
            <>
              <Link to="/" className="hover:underline">Home</Link>
              {user.role === "admin" && (
                <>
                  <Link to="/create-quiz" className="hover:underline">Create Quiz</Link>
                  <Link to="/admin/scores" className="hover:underline">View Scores</Link>
                  <Link to="/proctoring" className="hover:underline">Proctoring</Link>
                </>
              )}
              <button 
                onClick={logoutUser} 
                className="hover:underline bg-red-500 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
