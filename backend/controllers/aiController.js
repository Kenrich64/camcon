const axios = require("axios");
const pool = require("../db");

const CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_MODEL = "llama3.1-8b";
const FALLBACK_MESSAGE = "AI service temporarily unavailable";

console.log("[AI INIT] CEREBRAS_API_KEY:", process.env.CEREBRAS_API_KEY ? "EXISTS" : "MISSING");

const normalizeBody = (body) => {
  if (body && typeof body === "object" && body.data && typeof body.data === "object") {
    return body.data;
  }

  return body || {};
};

const stringifyContext = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (err) {
    return String(value);
  }
};

const buildInsightsPrompt = ({ payload, statsContext }) => {
  return [
    "You are a campus analytics assistant.",
    "Analyze the input and return concise practical insights.",
    "Respond with sections: insights, problems, suggestions.",
    "Payload:",
    stringifyContext(payload),
    "Database context:",
    stringifyContext(statsContext),
  ].join("\n");
};

const buildChatSystemPrompt = ({ dbContext, frontendContext }) => {
  return [
    "You are a campus analytics assistant.",
    "Answer using event and participation data.",
    "Keep responses short and actionable.",
    "Backend context:",
    stringifyContext(dbContext),
    "Frontend context:",
    stringifyContext(frontendContext || {}),
  ].join("\n");
};

const createCerebrasCompletion = async (messages, fallbackMessage = FALLBACK_MESSAGE) => {
  if (!process.env.CEREBRAS_API_KEY) {
    console.warn("[AI] Missing CEREBRAS_API_KEY, returning fallback");
    return fallbackMessage;
  }

  try {
    const response = await axios.post(
      CEREBRAS_URL,
      {
        model: CEREBRAS_MODEL,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    return response?.data?.choices?.[0]?.message?.content?.trim() || fallbackMessage;
  } catch (err) {
    console.error("[AI] Cerebras error:", err.message);
    return fallbackMessage;
  }
};

const fetchInsightsContext = async () => {
  const [eventsResult, attendanceResult, feedbackResult] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total_events FROM events`),
    pool.query(`
      SELECT
        COALESCE(SUM(attended_students), 0)::int AS total_attended,
        COALESCE(ROUND(AVG(attended_students::float / NULLIF(total_students, 0))::numeric, 2), 0) AS avg_attendance
      FROM events
    `),
    pool.query(`
      SELECT
        COALESCE(ROUND(AVG(score)::numeric, 2), 0) AS average_feedback_score,
        COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating
      FROM feedback
    `),
  ]);

  return {
    events: {
      totalEvents: eventsResult.rows[0]?.total_events || 0,
    },
    attendance: {
      totalAttended: attendanceResult.rows[0]?.total_attended || 0,
      avgAttendance: Number(attendanceResult.rows[0]?.avg_attendance || 0),
    },
    feedback: {
      averageFeedbackScore: Number(feedbackResult.rows[0]?.average_feedback_score || 0),
      averageRating: Number(feedbackResult.rows[0]?.average_rating || 0),
    },
  };
};

const fetchChatContext = async () => {
  const [overviewResult, departmentResult, recentEventsResult] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int AS total_events,
        COALESCE(SUM(attended_students), 0)::int AS total_participation,
        COALESCE(ROUND(AVG(attended_students::float / NULLIF(total_students, 0))::numeric, 2), 0) AS avg_attendance
      FROM events
    `),
    pool.query(`
      SELECT
        department,
        COALESCE(SUM(attended_students), 0)::int AS attendance
      FROM events
      GROUP BY department
      ORDER BY attendance DESC
      LIMIT 5
    `),
    pool.query(`
      SELECT id, title, department, date, venue, status
      FROM events
      ORDER BY date DESC NULLS LAST, id DESC
      LIMIT 8
    `),
  ]);

  return {
    overview: {
      totalEvents: overviewResult.rows[0]?.total_events || 0,
      totalParticipation: overviewResult.rows[0]?.total_participation || 0,
      avgAttendance: Number(overviewResult.rows[0]?.avg_attendance || 0),
    },
    topDepartments: departmentResult.rows,
    recentEvents: recentEventsResult.rows,
  };
};

const getSmartFallbackFromContext = (dbContext, question) => {
  const topDepartment = dbContext?.topDepartments?.[0]?.department || "CSE";
  const topAttendance = dbContext?.topDepartments?.[0]?.attendance || 0;
  const totalEvents = dbContext?.overview?.totalEvents || 0;
  const totalParticipation = dbContext?.overview?.totalParticipation || 0;
  const recentTitle = dbContext?.recentEvents?.[0]?.title || "the latest campus event";

  if ((question || "").toLowerCase().includes("department")) {
    return `Based on current data, ${topDepartment} shows the strongest participation trend with about ${topAttendance} attendees.`;
  }

  return `Based on current data, there are ${totalEvents} events with ${totalParticipation} total participation. Recent activity includes ${recentTitle}. ${topDepartment} is currently leading engagement.`;
};

const getSmartInsightsFallback = (statsContext) => {
  const totalEvents = statsContext?.events?.totalEvents || 0;
  const totalAttended = statsContext?.attendance?.totalAttended || 0;
  const avgAttendance = statsContext?.attendance?.avgAttendance || 0;

  return [
    "insights:",
    `- Total events tracked: ${totalEvents}`,
    `- Total attended students: ${totalAttended}`,
    `- Average attendance ratio: ${avgAttendance}`,
    "problems:",
    "- Some events may need stronger participation strategies.",
    "suggestions:",
    "- Focus promotion on lower-performing departments and time slots.",
  ].join("\n");
};

const generateInsights = async (req, res) => {
  const payload = normalizeBody(req.body);

  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: "Analytics payload is required" });
  }

  try {
    const statsContext = await fetchInsightsContext();

    const insightText = await createCerebrasCompletion(
      [
        {
          role: "system",
          content: buildInsightsPrompt({ payload, statsContext }),
        },
        {
          role: "user",
          content: "Analyze this dashboard data and provide insights.",
        },
      ],
      getSmartInsightsFallback(statsContext)
    );

    return res.json({ insight: insightText });
  } catch (err) {
    console.error("[AI] Insights error:", err.message);
    const statsContext = await fetchInsightsContext().catch(() => null);
    return res.json({
      insight: getSmartInsightsFallback(statsContext),
      error: "AI service unavailable, using smart fallback",
    });
  }
};

const chatWithAssistant = async (req, res) => {
  const { question } = req.body || {};
  const frontendContext = req.body?.context;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }

  try {
    const dbContext = await fetchChatContext();

    const responseText = await createCerebrasCompletion(
      [
        {
          role: "system",
          content: buildChatSystemPrompt({ dbContext, frontendContext }),
        },
        {
          role: "user",
          content: question.trim(),
        },
      ],
      getSmartFallbackFromContext(dbContext, question)
    );

    return res.json({ response: responseText });
  } catch (err) {
    console.error("[AI] Chat error:", err.message);
    const dbContext = await fetchChatContext().catch(() => null);
    return res.json({
      response: getSmartFallbackFromContext(dbContext, question),
      error: "Chat service temporarily unavailable",
    });
  }
};

module.exports = {
  generateInsights,
  chatWithAssistant,
};
