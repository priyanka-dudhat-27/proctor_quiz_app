    import React, { useState } from "react";
    import CustomInput from "../components/CustomInput";
    import CustomButton from "../components/CustomButton";
    import CustomCard from "../components/CustomCard";
    import { quizService } from "../services/apiServices";
    import toast from "react-hot-toast";

    const CreateQuiz = () => {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState([
        { id: Date.now(), question: "", options: ["", "", "", ""], correctOption: null },
    ]);

    const handleQuestionChange = (index, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index].question = value;
        setQuestions(updatedQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[qIndex].options[oIndex] = value;
        setQuestions(updatedQuestions);
    };

    const handleCorrectOption = (qIndex, oIndex) => {
        const updatedQuestions = [...questions];
        updatedQuestions[qIndex].correctOption = oIndex;
        setQuestions(updatedQuestions);
    };

    const addQuestion = () => {
        setQuestions([...questions, { id: Date.now(), question: "", options: ["", "", "", ""], correctOption: null }]);
    };

    const deleteQuestion = (id) => {
        if (questions.length > 1) {
        setQuestions(questions.filter((q) => q.id !== id));
        } else {
        toast.warning("At least one question is required!");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (!title || questions.some((q) => !q.question || q.options.some(opt => opt.trim() === "") || q.correctOption === null)) {
            toast.error("Please complete all fields before submitting!");
            return;
        }
    
        try {
            const quizData = { title, questions };
            const response = await quizService.createQuiz(quizData);
            toast.success("Quiz created successfully!");
    
            setTitle("");
            setQuestions([{ id: Date.now(), question: "", options: ["", "", "", ""], correctOption: null }]);
    
        } catch (error) {
            toast.error(error || "Failed to create quiz");
        }
    };
    
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
        <CustomCard className="w-full max-w-lg p-6">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Create a Quiz
            </h2>

            <form onSubmit={handleSubmit}>
            <CustomInput
                type="text"
                placeholder="Enter Quiz Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            {questions.map((q, qIndex) => (
                <div key={q.id} className="border p-4 rounded-lg mb-4 bg-gray-50 relative">
                <CustomInput
                    type="text"
                    placeholder={`Question ${qIndex + 1}`}
                    value={q.question}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                />

                {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2 mb-2">
                    <input
                        type="radio"
                        name={`correctOption-${qIndex}`}
                        checked={q.correctOption === oIndex}
                        onChange={() => handleCorrectOption(qIndex, oIndex)}
                        className="w-5 h-5 accent-blue-500"
                    />
                    <CustomInput
                        type="text"
                        placeholder={`Option ${oIndex + 1}`}
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    />
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => deleteQuestion(q.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                     Delete
                </button>
                </div>
            ))}

            <CustomButton text="➕ Add Question" onClick={addQuestion} bgColor="bg-green-500" hoverColor="hover:bg-green-600" />

            <CustomButton text="Create Quiz" onClick={handleSubmit} bgColor="bg-blue-500" hoverColor="hover:bg-blue-600" />
            </form>
        </CustomCard>
        </div>
    );
    };

    export default CreateQuiz;
