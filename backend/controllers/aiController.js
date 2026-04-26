const axios = require("axios");
const pool = require("../db");

const chatAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    console.log("CEREBRAS KEY:", process.env.CEREBRAS_API_KEY ? "EXISTS" : "MISSING");

    const response = await axios.post(
      "https://api.cerebras.ai/v1/chat/completions",
      {
        model: "llama3.1-8b",
        messages: [
          {
            role: "system",
            content:
              "You are a smart campus analytics assistant. Answer based on event participation, trends, and departments.",
          },
          {
            role: "user",
            content: question,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const aiReply = response.data?.choices?.[0]?.message?.content || "No response generated";

    res.json({ response: aiReply });
  } catch (error) {
    console.error("Cerebras error:", error.response?.data || error.message);

    const fallbackMessage =
      "AI service is temporarily unavailable. Please try again in a few moments.";

    res.status(502).json({ response: fallbackMessage });
  }
};

const getAIInsights = async (req, res) => {
  try {
    const [summaryResult, bestEventResult, worstEventResult, departmentResult, categoryResult, lowResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total_events, COALESCE(SUM(attended_students), 0)::int AS total_participation, COALESCE(AVG(attended_students), 0)::numeric AS avg_attendance, COALESCE(SUM(total_students), 0)::int AS total_capacity FROM events`),
      pool.query(`SELECT title, attended_students::int AS attended_students FROM events ORDER BY attended_students DESC, title ASC LIMIT 1`),
      pool.query(`SELECT title, attended_students::int AS attended_students FROM events ORDER BY attended_students ASC, title ASC LIMIT 1`),
      pool.query(`SELECT department, COALESCE(SUM(attended_students), 0)::int AS attendance FROM events GROUP BY department ORDER BY attendance DESC, department ASC LIMIT 1`),
      pool.query(`SELECT category, COUNT(*)::int AS count FROM feedback GROUP BY category ORDER BY count DESC, category ASC`),
      pool.query(`SELECT title, attended_students::int AS attended_students FROM events WHERE attended_students < 30 ORDER BY attended_students ASC, title ASC`),
    ]);

    const summary = summaryResult.rows[0] || {};
    if (!Number(summary.total_events || 0)) {
      return res.status(404).json({ error: "No event data found. Upload a CSV file first." });
    }

    const totalParticipation = Number(summary.total_participation || 0);
    const totalCapacity = Number(summary.total_capacity || 0);
    const avgAttendance = Number(summary.avg_attendance || 0);
    const attendanceRate = totalCapacity > 0 ? `${Math.round((totalParticipation / totalCapacity) * 100)}%` : "0%";

    return res.json({
      insights: {
        totalEvents: Number(summary.total_events || 0),
        totalParticipation,
        avgAttendance,
        attendanceRate,
        bestEvent: bestEventResult.rows[0]?.title || null,
        worstEvent: worstEventResult.rows[0]?.title || null,
        bestDepartment: departmentResult.rows[0]?.department || null,
        categoryDistribution: categoryResult.rows,
        lowEngagementEvents: lowResult.rows,
        lowEngagementCount: lowResult.rows.length,
      },
      insight: `Total events: ${Number(summary.total_events || 0)} | Total participation: ${totalParticipation} | Average attendance: ${avgAttendance.toFixed(0)} | Attendance rate: ${attendanceRate} | Best event: ${bestEventResult.rows[0]?.title || "N/A"} | Lowest event: ${worstEventResult.rows[0]?.title || "N/A"} | Best department: ${departmentResult.rows[0]?.department || "N/A"} | Low engagement events: ${lowResult.rows.length}`,
    });
  } catch (error) {
    console.error("AI insight error:", error.message);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
};

module.exports = {
  chatAI,
  getAIInsights,
};
