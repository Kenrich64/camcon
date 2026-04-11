const pool = require("../db");

// Add feedback for an event
const addFeedback = async (req, res, next) => {
  const { eventId } = req.params;
  const { userId, rating, comment } = req.body;

  try {
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const result = await pool.query(
      "INSERT INTO feedback (event_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [eventId, userId, rating, comment]
    );

    res.status(201).json({
      message: "Feedback added ✅",
      feedback: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// Get feedback for an event
const getEventFeedback = async (req, res, next) => {
  const { eventId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM feedback WHERE event_id = $1 ORDER BY created_at DESC",
      [eventId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addFeedback,
  getEventFeedback,
};
