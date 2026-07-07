// AI typing-passage generation via Groq (free, fast — Llama models).
// Get a free API key at https://console.groq.com/keys

const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const DIFFICULTY_HINT = {
  easy: "Use only very common, short everyday words (3-6 letters).",
  medium: "Use a natural mix of common and moderately advanced vocabulary.",
  hard: "Use longer, less common, and more sophisticated vocabulary.",
};

/**
 * Generate a typing-test passage with Groq.
 * Returns a single lowercase string of space-separated words.
 */
export const generateTypingText = async ({
  count = 30,
  topic = "",
  difficulty = "medium",
  includePunctuation = false,
  includeNumbers = false,
} = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured. Set GROQ_API_KEY in backend/.env");
  }

  const wordCount = Math.min(Math.max(Number(count) || 30, 10), 200);

  const prompt = [
    `Write a coherent passage of about ${wordCount} words for a typing-speed test.`,
    topic ? `Theme: ${topic}.` : "Pick any engaging everyday theme.",
    DIFFICULTY_HINT[difficulty] || DIFFICULTY_HINT.medium,
    includePunctuation
      ? "Include natural punctuation (commas, periods, question marks)."
      : "Do NOT use any punctuation marks at all.",
    includeNumbers
      ? "Include a few numbers written as digits (e.g. 42, 2025)."
      : "Do NOT include any digits or numbers.",
    "Output ONLY the passage text in lowercase — no title, no quotes, no commentary, no markdown.",
  ].join(" ");

  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 1.0,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content:
              "You generate clean text passages for a typing-speed practice app. Follow the formatting rules exactly and output only the passage.",
          },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Groq API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";

  // Normalize: lowercase, collapse whitespace/newlines into single spaces.
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, " ").trim();
  if (!cleaned) throw new Error("Empty generation");
  return cleaned;
};

// Low-level Groq chat helper (shared by the coach).
const groqChat = async (system, user, { temperature = 0.7 } = {}) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured. Set GROQ_API_KEY in backend/.env");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      max_tokens: 512,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Groq API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
};

/**
 * Analyze a finished test and return 2-4 short, personalized coaching tips.
 */
export const generateCoaching = async (stats = {}) => {
  const {
    wpm = 0,
    accuracy = 0,
    consistency = 0,
    raw = 0,
    errors = 0,
    mode = "time",
    duration = null,
    wordCount = null,
    wpmSeries = [],
    topMistakes = [],
  } = stats;

  const series = Array.isArray(wpmSeries)
    ? wpmSeries.slice(0, 60).join(", ")
    : "";

  const user = [
    "Here is a typing-test result. Give the user feedback.",
    `WPM: ${wpm}`,
    `Accuracy: ${accuracy}%`,
    `Consistency: ${consistency}%`,
    `Characters typed: ${raw}, errors: ${errors}`,
    `Mode: ${mode}${
      mode === "time" ? ` (${duration}s)` : ` (${wordCount} words)`
    }`,
    series ? `WPM over time (per second): ${series}` : "",
    topMistakes.length > 0 ? `Historically struggles with characters: ${topMistakes.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const system =
    "You are an encouraging but sharp typing coach. Analyze the result and identify the single biggest weakness. If the user struggled with specific characters, EXACTLY 2 of your 3 tips MUST focus directly and explicitly on practicing those specific characters, and point out their mistake to create a strong impact on them. The 3rd tip should focus on speed or consistency. Each tip must be one sentence, under 18 words, and highly specific. Be motivating but firm. Return ONLY a JSON array of 3 strings, nothing else.";

  const content = await groqChat(system, user, { temperature: 0.7 });

  // Parse a JSON array out of the response; fall back to line splitting.
  const match = content.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr) && arr.length) {
        return arr.map((t) => String(t).trim()).filter(Boolean).slice(0, 4);
      }
    } catch {
      /* fall through to line splitting */
    }
  }

  const lines = content
    .split("\n")
    .map((l) => l.replace(/^[\s\-*•\d.)"]+/, "").trim())
    .filter((l) => l.length > 3);
  if (!lines.length) throw new Error("Empty coaching response");
  return lines.slice(0, 4);
};
