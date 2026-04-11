const pool = require("../db");

// A) Overview stats for dashboard cards
const getOverviewStats = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT e.id)::int AS total_events,
        COALESCE(SUM(COALESCE(p.attended, 0)), 0)::int AS total_participation,
        COALESCE(ROUND(AVG(f.score)::numeric, 2), 0) AS average_feedback_score
      FROM events e
      LEFT JOIN participation p ON p.event_id = e.id
      LEFT JOIN feedback f ON f.event_id = e.id
    `);

    const stats = result.rows[0];

    res.json({
      totalEvents: stats.total_events,
      totalParticipation: stats.total_participation,
      averageFeedbackScore: Number(stats.average_feedback_score),
    });
  } catch (err) {
    next(err);
  }
};

// B) Department distribution for charting
const getDepartmentDistribution = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        e.department,
        COUNT(DISTINCT e.id)::int AS event_count,
        COALESCE(SUM(COALESCE(p.attended, 0)), 0)::int AS participation_count
      FROM events e
      LEFT JOIN participation p ON p.event_id = e.id
      GROUP BY e.department
      ORDER BY participation_count DESC
    `);

    res.json({
      labels: result.rows.map((row) => row.department),
      series: result.rows.map((row) => ({
        department: row.department,
        eventCount: row.event_count,
        participationCount: row.participation_count,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// C) Monthly participation trend for chart
const getParticipationTrend = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', e.date), 'YYYY-MM') AS month,
        COALESCE(SUM(COALESCE(p.attended, 0)), 0)::int AS total_attendance,
        COUNT(DISTINCT e.id)::int AS total_events
      FROM events e
      LEFT JOIN participation p ON p.event_id = e.id
      GROUP BY DATE_TRUNC('month', e.date)
      ORDER BY DATE_TRUNC('month', e.date)
    `);

    res.json({
      labels: result.rows.map((row) => row.month),
      series: result.rows.map((row) => ({
        month: row.month,
        totalAttendance: row.total_attendance,
        totalEvents: row.total_events,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// D) Feedback stats (simplified & FIXED)
const getFeedbackStats = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        category,
        ROUND(AVG(score)::numeric, 2) AS average_score,
        COUNT(*)::int AS response_count
      FROM feedback
      GROUP BY category
      ORDER BY category
    `);

    res.json({
      labels: result.rows.map((row) => row.category),
      series: result.rows.map((row) => ({
        category: row.category,
        averageScore: Number(row.average_score),
        responseCount: row.response_count,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewStats,
  getDepartmentDistribution,
  getParticipationTrend,
  getFeedbackStats,
};