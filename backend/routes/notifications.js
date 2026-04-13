const express = require("express");
const {
  getNotifications,
  markNotificationAsRead,
} = require("../controllers/notificationsController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.put("/read/:id", verifyToken, markNotificationAsRead);

module.exports = router;
