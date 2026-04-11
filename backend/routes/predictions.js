const express = require("express");
const { getPredictions } = require("../controllers/predictionsController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected route
router.get("/", verifyToken, getPredictions);

module.exports = router;
