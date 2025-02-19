import Header from "./components/Header"
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateQuiz from "./pages/CreateQuiz";
import Home from "./pages/Home";
import ViewScores from "./pages/ViewScores";
import QuizDetail from "./pages/QuizDetail";

function App() {

  return (
    <>
      <Header/>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/quiz/:quizId" element={<QuizDetail />} />
        <Route path="/view-score" element={<ViewScores />} />
      </Routes>
    </>
  )
}

export default App
