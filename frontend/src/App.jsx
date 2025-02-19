import Header from "./components/Header"
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateQuiz from "./pages/CreateQuiz";
import Home from "./pages/Home";
import ViewScores from "./pages/ViewScores";
import QuizDetails from "./pages/QuizDetails";

function App() {

  return (
    <>
      <Header/>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/specific-quiz/:quizId" element={<QuizDetails/>} />
      </Routes>
    </>
  )
}

export default App
