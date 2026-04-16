const axios = require("axios");
const pool = require("../db");

const getDatasetSnapshot = async () => {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_events,
      COALESCE(SUM(attended_students), 0)::int AS total_attendance,
      COALESCE(AVG(attended_students), 0)::numeric AS avg_attendance
    FROM events
  `);

  const topDepartmentResult = await pool.query(`
    SELECT department, COALESCE(SUM(attended_students), 0)::int AS attendance
    FROM events
    GROUP BY department
    ORDER BY attendance DESC, department ASC
    LIMIT 1
  `);

  return {
    totals: result.rows[0],
    topDepartment: topDepartmentResult.rows[0] || null,
  };
};

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

const generateInsights = async (req, res) => {
  try {
    const snapshot = await getDatasetSnapshot();
    const totalEvents = Number(snapshot.totals?.total_events || 0);

    if (totalEvents === 0) {
      return res.status(400).json({
        error: "No uploaded dataset available. Upload CSV data before requesting insights.",
      });
    }

    const totalAttendance = Number(snapshot.totals?.total_attendance || 0);
    const avgAttendance = Number(snapshot.totals?.avg_attendance || 0);
    const topDepartment = snapshot.topDepartment?.department || "N/A";

    const insight = [
      `Dataset contains ${totalEvents} events with ${totalAttendance} total attendees.`,
      `Average attendance per event is ${avgAttendance.toFixed(2)}.`,
      `Top department by attendance is ${topDepartment}.`,
      "Use this upload cycle as the source of truth for planning and forecasting.",
    ].join("\n");

    return res.json({ insight });
  } catch (error) {
    console.error("AI insight error:", error.message);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
};

module.exports = {
  chatAI,
  generateInsights,
};
