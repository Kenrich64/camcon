const pool = require("../db");

const createNotification = async ({ title, message, type = "update", targetAudience = "all" }) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications (title, message, type, target_audience)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, message, type, targetAudience]
    );
    return result.rows[0];
  } catch (error) {
    console.error("[Notification] Failed to create notification", error);
    return null;
  }
};

const getNotificationScopeClause = (role) => {
  if (role === "admin") {
    return "TRUE";
  }

  return "n.target_audience IN ('all', $2)";
};

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || "user";

    const result = await pool.query(
      `SELECT
         n.id,
         n.title,
         n.message,
         n.type,
         n.target_audience,
         n.created_at,
         CASE WHEN nr.notification_id IS NULL THEN FALSE ELSE TRUE END AS is_read
       FROM notifications n
       LEFT JOIN notification_reads nr
         ON nr.notification_id = n.id
        AND nr.user_id = $1
       WHERE ${getNotificationScopeClause(userRole)}
       ORDER BY n.created_at DESC`,
      userRole === "admin" ? [userId] : [userId, userRole]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || "user";

    const result = await pool.query(
      `SELECT COUNT(*)::int AS unread_count
       FROM notifications n
       LEFT JOIN notification_reads nr
         ON nr.notification_id = n.id
        AND nr.user_id = $1
       WHERE ${getNotificationScopeClause(userRole)}
         AND nr.notification_id IS NULL`,
      userRole === "admin" ? [userId] : [userId, userRole]
    );

    return res.json({ unreadCount: result.rows[0]?.unread_count || 0 });
  } catch (error) {
    return next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || "user";
    const notificationId = req.body?.notificationId || req.params?.id;

    if (!notificationId) {
      return res.status(400).json({ error: "notificationId is required" });
    }

    const notificationResult = await pool.query(
      `SELECT *
       FROM notifications
       WHERE id = $1
         AND (${userRole === "admin" ? "TRUE" : "target_audience IN ('all', $2)"})
       LIMIT 1`,
      userRole === "admin" ? [notificationId] : [notificationId, userRole]
    );

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await pool.query(
      `INSERT INTO notification_reads (notification_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [notificationId, userId]
    );

    return res.json({
      message: "Notification marked as read",
      notification: {
        ...notificationResult.rows[0],
        is_read: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
};
