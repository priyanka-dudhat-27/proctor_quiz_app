import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    title: String,
    questions: [
        {
            question: String,
            options: [String],
            correctAnswer: Number,
        }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

export default mongoose.model("Quiz", quizSchema);
