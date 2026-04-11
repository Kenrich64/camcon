const axios = require("axios");
const pool = require("../db");

const HF_MODEL = "google/flan-t5-base";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const REQUEST_TIMEOUT = 60000;

const getHeaders = () => ({
  Authorization: `Bearer ${HF_API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

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

const buildInsightsPrompt = (data) => {
  const contextText = stringifyContext(data);

  return [
    "Act as a campus analytics expert.",
    "Analyze the data below and return concise, practical findings.",
    "Include the following sections in plain text: insights, problems, suggestions.",
    "Use short bullet points.",
    "Data:",
    contextText,
  ].join("\n");
};

const buildChatPrompt = ({ question, dbContext, frontendContext }) => {
  return [
    "You are Camcon AI Assistant, an expert campus analytics and event operations advisor.",
    "Answer the user's question using the provided context.",
    "Be concise, practical, and specific.",
    "If information is missing, say so briefly and suggest what to check.",
    "Question:",
    question,
    "Context:",
    stringifyContext({ frontendContext, backendContext: dbContext }),
  ].join("\n");
};

const extractGeneratedText = (data) => {
  if (Array.isArray(data)) {
    const firstItem = data[0] || {};
    return firstItem.generated_text || firstItem.summary_text || firstItem.answer || firstItem.text || "";
  }

  if (data && typeof data === "object") {
    return data.generated_text || data.summary_text || data.answer || data.text || data.response || "";
  }

  return "";
};

const callHuggingFace = async (prompt) => {
  if (!HF_API_KEY) {
    const error = new Error("Missing Hugging Face API key");
    error.statusCode = 500;
    throw error;
  }

  const response = await axios.post(
    HF_API_URL,
    {
      inputs: prompt,
      parameters: {
        max_new_tokens: 256,
        temperature: 0.2,
        return_full_text: false,
      },
      options: {
        wait_for_model: true,
      },
    },
    {
      timeout: REQUEST_TIMEOUT,
      headers: getHeaders(),
    }
  );

  const generatedText = extractGeneratedText(response.data);

  if (!generatedText) {
    throw new Error("Empty model response");
  }

  return String(generatedText).trim();
};

const generateInsights = async (req, res) => {
  const payload = normalizeBody(req.body);

  if (!payload || typeof payload !== "object" || Array.isArray(payload) || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: "Analytics payload is required" });
  }

  try {
    console.info("[AI] Generating insights with Hugging Face model:", HF_MODEL);

    const prompt = buildInsightsPrompt(payload);
    const insightText = await callHuggingFace(prompt);

    return res.json({
      insight: insightText,
    });
  } catch (err) {
    console.error("[AI] Insights generation failed:", err.message);
    return res.status(500).json({ error: "AI failed" });
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
  const question = req.body?.question;
  const frontendContext = req.body?.context;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }

  try {
    console.info("[AI] Chat request received");

    const dbContext = await fetchChatContext();
    const prompt = buildChatPrompt({
      question: question.trim(),
      frontendContext,
      dbContext,
    });

    const responseText = await callHuggingFace(prompt);

    return res.json({
      response: responseText,
    });
  } catch (err) {
    console.error("[AI] Chat failed:", err.message);
    return res.status(500).json({ error: "AI failed" });
  }
};

module.exports = {
  generateInsights,
  chatWithAssistant,
};
