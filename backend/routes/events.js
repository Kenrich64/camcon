const express = require("express");
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventsController");
const { verifyToken, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getEvents);
router.get("/:id", getEventById);

// Protected routes (require authentication)
router.post("/", verifyToken, adminOnly, createEvent);
router.put("/:id", verifyToken, adminOnly, updateEvent);
router.delete("/:id", verifyToken, adminOnly, deleteEvent);

module.exports = router;
