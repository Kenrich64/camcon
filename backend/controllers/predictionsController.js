const pool = require("../db");

// Get predictions - average attendance, best department, etc
const getPredictions = async (req, res, next) => {
  try {
    const predictionResult = await pool.query(`
      SELECT
        COALESCE(AVG(attended_students), 0)::numeric AS avg_attendance
      FROM events
    `);

    const bestDepartmentResult = await pool.query(`
      SELECT department, COALESCE(SUM(attended_students), 0)::int AS total_attendance
      FROM events
      GROUP BY department
      ORDER BY total_attendance DESC, department ASC
      LIMIT 1
    `);

    const feedbackResult = await pool.query(
      "SELECT COALESCE(AVG(rating), 0)::numeric as avg_feedback FROM feedback"
    );

    const row = predictionResult.rows[0] || {};
    const bestDepartment = bestDepartmentResult.rows[0] || null;

    res.json({
      average_attendance: Number(row.avg_attendance || 0),
      best_department: bestDepartment ? { department: bestDepartment.department } : null,
      average_feedback: Number(feedbackResult.rows[0]?.avg_feedback || 0),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPredictions };
