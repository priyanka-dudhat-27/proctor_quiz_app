import Header from "./components/Header"
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateQuiz from "./pages/CreateQuiz";
import Home from "./pages/Home";
import QuizDetails from "./pages/QuizDetails";
import { AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import AdminViewScores from "./pages/AdminViewScores";
import AdminMonitoring from './pages/AdminMonitoring';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Header/>
       
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/specific-quiz/:quizId" element={<QuizDetails/>} />
        <Route path="/admin/scores" element={<AdminViewScores />} /> 
        <Route path="/admin/monitoring" element={
            <AdminMonitoring />
        } /> 

      </Routes>
    </>
  )
}

export default App
