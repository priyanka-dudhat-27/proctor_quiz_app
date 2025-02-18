import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { handleTabSwitch, terminateQuiz } from "../controllers/proctoringController.js";

const router = express.Router();

//  Handle tab switch warning
router.post("/tab-switch", protect, handleTabSwitch);

//  Terminate quiz after 3 warnings
router.post("/terminate", protect, terminateQuiz);

export default router;
