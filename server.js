import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM = `You are a technical chart analyst for EDUCATION only. Not a financial advisor.
Never claim certainty. Never use confidence 100.
Analyze trend, candles, support/resistance, momentum from the chart image.
Reply ONLY valid JSON:
{
  "direction": "UP" | "DOWN" | "NEUTRAL",
  "confidence": number between 1 and 95,
  "trend": "short string",
  "pattern": "short string",
  "momentum": "Strong" | "Moderate" | "Weak",
  "summary": "1-2 sentences mentioning uncertainty"
}`;

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Invalid JSON from model");
  }
}

async function callOpenAI(imageBase64, mime) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this trading chart image." },
            {
              type: "image_url",
              image_url: { url: `data:\( {mime};base64, \){imageBase64}` }
            }
          ]
        }
      ]
    })
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "OpenAI failed");
  return safeParseJSON(data.choices[0].message.content);
}

async function callGrok(imageBase64, mime) {
  const key = process.env.XAI_API_KEY;
  if (!key) throw new Error("XAI_API_KEY missing");

  const r = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "grok-2-vision-1212",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this trading chart. JSON only." },
            {
              type: "image_url",
              image_url: { url: `data:\( {mime};base64, \){imageBase64}` }
            }
          ]
        }
      ]
    })
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || JSON.stringify(data) || "Grok failed");
  return safeParseJSON(data.choices[0].message.content);
}

async function callGemini(imageBase64, mime) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM + "\nAnalyze this chart. JSON only." },
            { inline_data: { mime_type: mime, data: imageBase64 } }
          ]
        }
      ],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Gemini failed");
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return safeParseJSON(text);
}

function aggregate(results) {
  const ok = results.filter(Boolean);
  if (!ok.length) throw new Error("All AI providers failed");

  const ups = ok.filter((x) => String(x.direction).toUpperCase() === "UP").length;
  const downs = ok.filter((x) => String(x.direction).toUpperCase() === "DOWN").length;

  let direction = "NEUTRAL";
  if (ups > downs) direction = "UP";
  if (downs > ups) direction = "DOWN";

  const avg =
    ok.reduce((s, x) => s + Math.min(95, Math.max(1, Number(x.confidence) || 50)), 0) /
    ok.length;
  const agreement = Math.max(ups, downs, 0.01) / ok.length;
  const confidence = Math.min(95, Math.round(avg * (0.55 + 0.45 * agreement)));

  const best = [...ok].sort(
    (a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0)
  )[0];

  return {
    direction,
    confidence,
    trend: best.trend || "--",
    pattern: best.pattern || "--",
    momentum: best.momentum || "--",
    summary: best.summary || "",
    providers: ok.length,
    votes: { up: ups, down: downs, total: ok.length }
  };
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType, marketType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ ok: false, error: "No image provided" });
    }

    const mime = mimeType || "image/jpeg";
    const settled = await Promise.allSettled([
      callOpenAI(imageBase64, mime),
      callGrok(imageBase64, mime),
      callGemini(imageBase64, mime)
    ]);

    const parsed = settled.map((s) => {
      if (s.status === "fulfilled") return s.value;
      console.error("Provider error:", s.reason?.message || s.reason);
      return null;
    });

    const result = aggregate(parsed);
    res.json({
      ok: true,
      marketType: marketType || "real",
      ...result,
      disclaimer:
        "Educational analysis only. Not financial advice. AI estimates can be wrong."
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message || "Server error" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AI Market Analyzer → http://localhost:${PORT}`);
});
