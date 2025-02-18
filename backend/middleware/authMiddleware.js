import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (error) {
        res.status(401).json({ message: "Token failed" });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") next();
    else res.status(403).json({ message: "Admin only" });
};

export { protect, admin };
