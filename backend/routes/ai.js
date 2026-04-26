const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { chatAI, getAIInsights } = require("../controllers/aiController");

router.post("/chat", verifyToken, chatAI);
router.get("/ai-insights", verifyToken, getAIInsights);
router.post("/insights", verifyToken, getAIInsights);

module.exports = router;
