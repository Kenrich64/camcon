const pool = require("../db");

// Get predictions - average attendance, best department, etc
const getPredictions = async (req, res, next) => {
  try {
    const predictionResult = await pool.query(`
      SELECT
        COALESCE(AVG(attended_students), 0) AS avg_attendance,
        MAX(department) AS best_department
      FROM events
    `);

    const feedbackResult = await pool.query(
      "SELECT AVG(rating) as avg_feedback FROM feedback"
    );

    const row = predictionResult.rows[0] || {};

    res.json({
      average_attendance: Number(row.avg_attendance || 0),
      best_department: row.best_department ? { department: row.best_department } : null,
      average_feedback: feedbackResult.rows[0].avg_feedback || 0,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPredictions };
