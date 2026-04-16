const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { chatAI, generateInsights } = require("../controllers/aiController");

router.post("/chat", verifyToken, chatAI);
router.post("/insights", verifyToken, generateInsights);

module.exports = router;
