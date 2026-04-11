const express = require("express");
const {
  addFeedback,
  getEventFeedback,
} = require("../controllers/feedbackController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Protected routes
router.post("/:eventId/add", verifyToken, addFeedback);
router.get("/:eventId", verifyToken, getEventFeedback);

module.exports = router;
