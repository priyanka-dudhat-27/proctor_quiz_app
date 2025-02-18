import Attempt from "../models/Attempt.js";

let userWarnings = {}; // Store tab switch warnings per user

//  Handle live camera streaming using Socket.io
export const handleCameraStream = (io) => {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("stream", (data) => {
            socket.broadcast.emit("receiveStream", data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};

//  Handle tab switching warnings
export const handleTabSwitch = (req, res) => {
    const userId = req.user.id;

    if (!userWarnings[userId]) userWarnings[userId] = 0;
    userWarnings[userId]++;

    if (userWarnings[userId] >= 3) {
        delete userWarnings[userId];
        return res.status(403).json({ message: "Quiz terminated due to multiple tab switches!" });
    }

    res.json({ message: `Warning ${userWarnings[userId]}/3: Stay on the quiz tab!` });
};

//  Handle quiz termination after 3 warnings
export const terminateQuiz = async (req, res) => {
    const userId = req.user.id;

    // Mark the quiz as failed (0 score)
    const attempt = new Attempt({ user: userId, quiz: req.body.quizId, score: 0 });
    await attempt.save();

    delete userWarnings[userId];
    res.status(403).json({ message: "Quiz terminated due to tab switching!" });
};
