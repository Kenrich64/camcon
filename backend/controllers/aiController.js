const GroqSdk = require("groq-sdk");
const pool = require("../db");

const Groq = GroqSdk.default || GroqSdk;
let groqClient = null;

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
};

const GROQ_MODEL = "llama3-8b-8192";
const FALLBACK_MESSAGE = "AI service temporarily unavailable";

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
  const contextText = stringifyContext(payload);
  const statsText = stringifyContext(statsContext);

  return [
    "Act as a campus analytics expert.",
    "Analyze the data below and return concise, practical findings.",
    "Focus strongly on event volume, participation statistics, and feedback averages.",
    "Use the database context to make the response more specific and grounded.",
    "Include the following sections in plain text: insights, problems, suggestions.",
    "Use short bullet points.",
    "Payload:",
    contextText,
    "Database context:",
    statsText,
  ].join("\n");
};

const buildChatSystemPrompt = ({ dbContext, frontendContext }) => {
  return [
    "You are Camcon AI Assistant, an expert campus analytics and event operations advisor.",
    "Answer the user's question using the provided context about events, participation, and feedback.",
    "Be concise, practical, and specific.",
    "If information is missing, say so briefly and suggest what to check.",
    "Backend context:",
    stringifyContext(dbContext),
    "Frontend context:",
    stringifyContext(frontendContext || {}),
  ].join("\n");
};

const createGroqCompletion = async (messages, fallbackMessage = FALLBACK_MESSAGE) => {
  const groq = getGroqClient();

  if (!groq) {
    return fallbackMessage;
  }

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
    });

    return response.choices?.[0]?.message?.content?.trim() || fallbackMessage;
  } catch (error) {
    console.error("[AI] Groq request failed:", error.message);
    return fallbackMessage;
  }
};

const fetchInsightsContext = async () => {
  const [eventsResult, participationResult, feedbackResult] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total_events FROM events`),
    pool.query(`
      SELECT
        COALESCE(SUM(attended), 0)::int AS total_attended,
        COUNT(*)::int AS participation_records
      FROM participation
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
    participation: {
      totalAttended: participationResult.rows[0]?.total_attended || 0,
      records: participationResult.rows[0]?.participation_records || 0,
    },
    feedback: {
      averageFeedbackScore: Number(feedbackResult.rows[0]?.average_feedback_score || 0),
      averageRating: Number(feedbackResult.rows[0]?.average_rating || 0),
    },
  };
};

const generateInsights = async (req, res) => {
  const payload = normalizeBody(req.body);

  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: "Analytics payload is required" });
  }

  try {
    console.info("[AI] Generating insights with Groq model:", GROQ_MODEL);

    const statsContext = await fetchInsightsContext();
    const insightText = await createGroqCompletion(
      [
        {
          role: "system",
          content: buildInsightsPrompt({
            payload,
            statsContext,
          }),
        },
        {
          role: "user",
          content: "Analyze this dashboard data and produce the requested output.",
        },
      ],
      FALLBACK_MESSAGE
    );

    return res.json({
      insight: insightText,
    });
  } catch (err) {
    console.error("[AI] Insights generation failed:", err.message);
    return res.json({ insight: FALLBACK_MESSAGE });
  }
};

const fetchChatContext = async () => {
  const [overviewResult, departmentResult, recentEventsResult] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(DISTINCT e.id)::int AS total_events,
        COALESCE(SUM(COALESCE(p.attended, 0)), 0)::int AS total_participation,
        COALESCE(ROUND(AVG(f.score)::numeric, 2), 0) AS average_feedback_score
      FROM events e
      LEFT JOIN participation p ON p.event_id = e.id
      LEFT JOIN feedback f ON f.event_id = e.id
    `),
    pool.query(`
      SELECT
        e.department,
        COALESCE(SUM(COALESCE(p.attended, 0)), 0)::int AS attendance
      FROM events e
      LEFT JOIN participation p ON p.event_id = e.id
      GROUP BY e.department
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
      averageFeedbackScore: Number(overviewResult.rows[0]?.average_feedback_score || 0),
    },
    topDepartments: departmentResult.rows,
    recentEvents: recentEventsResult.rows,
  };
};

const chatWithAssistant = async (req, res) => {
  const { question } = req.body || {};
  const frontendContext = req.body?.context;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }

  try {
    console.info("[AI] Chat request received with Groq model:", GROQ_MODEL);

    const dbContext = await fetchChatContext();
    const responseText = await createGroqCompletion([
      {
        role: "system",
        content: buildChatSystemPrompt({
          dbContext,
          frontendContext,
        }),
      },
      {
        role: "user",
        content: question.trim(),
      },
    ]);

    return res.json({
      response: responseText,
    });
  } catch (err) {
    console.error("[AI] Chat failed:", err.message);
    return res.json({ response: FALLBACK_MESSAGE });
  }
};

module.exports = {
  generateInsights,
  chatWithAssistant,
};
