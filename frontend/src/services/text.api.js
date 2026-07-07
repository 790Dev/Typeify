import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/v1/text`;

export const generateText = async (opts) => {
  const res = await fetch(`${API_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "AI text unavailable");
  return data.data.text; // unpack { text } from data.data
};
