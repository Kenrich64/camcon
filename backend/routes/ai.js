const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { chatAI } = require("../controllers/aiController");

router.post("/chat", verifyToken, chatAI);

module.exports = router;
