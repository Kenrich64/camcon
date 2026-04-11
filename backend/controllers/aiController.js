const axios = require("axios");
const pool = require("../db");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma:2b";

const buildPrompt = (payload) => {
  const prettyPayload = JSON.stringify(payload, null, 2);

  return [
    "You are a campus analytics expert.",
    "Analyze the following campus event analytics data and return practical insight.",
    "Respond ONLY as valid JSON with exactly these keys:",
    "insights (array of strings), weaknesses (array of strings), recommendations (array of strings)",
    "Keep each item concise and actionable.",
    "Data:",
    prettyPayload,
  ].join("\n");
};

const normalizeToText = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    return "No AI insight generated.";
  }

  try {
    const parsed = JSON.parse(rawText);
    const insights = Array.isArray(parsed.insights) ? parsed.insights : [];
    const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

    const section = (title, items) => {
      if (!items.length) {
        return `${title}:\n- Not provided`;
      }

      return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`;
    };

    return [
      section("Insights", insights),
      section("Weaknesses", weaknesses),
      section("Recommendations", recommendations),
    ].join("\n\n");
  } catch (parseErr) {
    return rawText.trim();
  }
};

const generateInsights = async (req, res, next) => {
  const analytics = req.body;

  if (!analytics || typeof analytics !== "object") {
    return res.status(400).json({ error: "Analytics payload is required" });
  }

  try {
    console.info("[AI] Generating insights with model:", OLLAMA_MODEL);

    const prompt = buildPrompt(analytics);

    const ollamaResponse = await axios.post(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      },
      {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const rawModelResponse = ollamaResponse?.data?.response || "";
    const insightText = normalizeToText(rawModelResponse);

    return res.json({
      insight: insightText,
    });
  } catch (err) {
    console.error("[AI] Insight generation failed:", err.message);

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Ollama service is unavailable. Ensure Ollama is running on localhost:11434.",
      });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({
        error: "AI insight request timed out.",
      });
    }

    return next(err);
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

const buildChatPrompt = ({ question, contextData, dbContext }) => {
  const contextText = JSON.stringify(
    {
      frontendContext: contextData || null,
      backendContext: dbContext,
    },
    null,
    2
  );

  return [
    "You are Camcon AI Assistant, an expert campus analytics and event operations advisor.",
    "Answer the user question using the provided context data.",
    "Be concise, practical, and specific to this campus dataset.",
    "If data is missing, state assumptions clearly.",
    "Use short paragraphs and bullet points when useful.",
    "User question:",
    question,
    "Context data:",
    contextText,
  ].join("\n");
};

const chatWithAssistant = async (req, res, next) => {
  const question = req.body?.question;
  const contextData = req.body?.context;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }

  try {
    const dbContext = await fetchChatContext();
    const prompt = buildChatPrompt({
      question: question.trim(),
      contextData,
      dbContext,
    });

    console.info("[AI] Chat request received");

    const ollamaResponse = await axios.post(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      },
      {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = (ollamaResponse?.data?.response || "").trim();

    return res.json({
      response: responseText || "I could not generate a response right now.",
    });
  } catch (err) {
    console.error("[AI] Chat failed:", err.message);

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Ollama service is unavailable. Ensure Ollama is running on localhost:11434.",
      });
    }

    if (err.code === "ECONNABORTED") {
      return res.status(504).json({
        error: "AI chat request timed out.",
      });
    }

    return next(err);
  }
};

module.exports = {
  generateInsights,
  chatWithAssistant,
};
