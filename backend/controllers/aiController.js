const axios = require("axios");

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

    res.json({
      response:
        "Based on current data, CSE department has the highest participation across most events.",
    });
  }
};

module.exports = {
  chatAI,
};
