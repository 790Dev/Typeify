import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/v1/coach`;

export const getCoaching = async (stats) => {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(stats),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "AI coaching unavailable");
  return data.data.tips; // unpack { tips } from data.data
};
