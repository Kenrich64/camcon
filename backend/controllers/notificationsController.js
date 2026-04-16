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
       WHERE $2 = 'admin'
         OR n.target_audience = 'all'
         OR n.target_audience = $2
       ORDER BY n.created_at DESC`,
      [userId, userRole]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || "user";

    const notificationResult = await pool.query(
      `SELECT *
       FROM notifications
       WHERE id = $1
         AND ($2 = 'admin' OR target_audience = 'all' OR target_audience = $2)
       LIMIT 1`,
      [id, userRole]
    );

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await pool.query(
      `INSERT INTO notification_reads (notification_id, user_id, read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (notification_id, user_id) DO UPDATE SET read_at = EXCLUDED.read_at`,
      [id, userId]
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
  markNotificationAsRead,
};
