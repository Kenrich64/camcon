const pool = require("../db");

// Get predictions - average attendance, best department, etc
const getPredictions = async (req, res, next) => {
  try {
    // Calculate average attendance
    const attendanceResult = await pool.query(
      "SELECT AVG(total_students) as avg_attendance FROM events"
    );

    // Get best performing department
    const departmentResult = await pool.query(`
      SELECT department, AVG(total_students) as avg_attendance
      FROM events
      GROUP BY department
      ORDER BY avg_attendance DESC
      LIMIT 1
    `);

    // Get average feedback rating
    const feedbackResult = await pool.query(
      "SELECT AVG(rating) as avg_feedback FROM feedback"
    );

    res.json({
      average_attendance: attendanceResult.rows[0].avg_attendance || 0,
      best_department: departmentResult.rows[0] || null,
      average_feedback: feedbackResult.rows[0].avg_feedback || 0,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPredictions };
