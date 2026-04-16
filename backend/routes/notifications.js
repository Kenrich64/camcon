const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
} = require("../controllers/notificationsController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);
router.post("/read", verifyToken, markNotificationAsRead);
router.post("/read/:id", verifyToken, markNotificationAsRead);
router.put("/read/:id", verifyToken, markNotificationAsRead);

module.exports = router;
