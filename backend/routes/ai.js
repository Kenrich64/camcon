const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { generateInsights, chatWithAssistant } = require("../controllers/aiController");

router.post("/insights", verifyToken, generateInsights);
router.post("/chat", verifyToken, chatWithAssistant);

module.exports = router;
