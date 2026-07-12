require("dotenv").config();
const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- very basic in-memory rate limiting (per IP, per minute) ---
// Good enough to stop accidental hammering / simple abuse.
// Swap for a real store (Redis) if you deploy this at any scale.
const RATE_LIMIT = 12; // requests
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const record = hits.get(ip) || { count: 0, windowStart: now };
  if (now - record.windowStart > RATE_WINDOW_MS) {
    record.count = 0;
    record.windowStart = now;
  }
  record.count += 1;
  hits.set(ip, record);
  return record.count > RATE_LIMIT;
}

const SYSTEM_PROMPT = `You are a precise Excel formula reference assistant.
Given a user's query (a formula name, or a description of what they want to do in Excel),
use web search to confirm current, accurate details, then respond with ONLY a single JSON
object — no markdown fences, no prose before or after. Shape:

{
  "formula": "SUMIFS",
  "syntax": "=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)",
  "description": "One or two plain-language sentences on what it does and when to use it.",
  "example": "A short, concrete example formula with a one-line explanation of the result.",
  "commonMistakes": ["Mistake one, briefly.", "Mistake two, briefly."],
  "relatedFormulas": ["SUMIF", "COUNTIFS"]
}

If the query doesn't match a real Excel formula, do your best to identify the closest
relevant formula(s) and explain that in "description" instead of failing.`;

app.post("/api/search", async (req, res) => {
  const ip = req.ip;
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  const query = (req.body.query || "").trim();
  if (!query) {
    return res.status(400).json({ error: "Missing 'query' in request body." });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: query }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const cleaned = text.replace(/^```json\s*|^```\s*|```$/gm, "").trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(502).json({
        error: "Got a response but couldn't parse it as JSON.",
        raw: text,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Anthropic API error:", err);
    res.status(500).json({ error: "Something went wrong looking that up. Try again." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Excel Formula Finder running on http://localhost:${PORT}`);
});
