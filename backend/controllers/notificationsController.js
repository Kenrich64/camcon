const pool = require("../db");

const createNotification = async ({ title, message, type = "update" }) => {
  try {
    const result = await pool.query(
      "INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3) RETURNING *",
      [title, message, type]
    );
    return result.rows[0];
  } catch (error) {
    console.error("[Notification] Failed to create notification", error);
    return null;
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM notifications ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
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
