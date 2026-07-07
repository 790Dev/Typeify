import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/v1/scores`;

export const getLeaderboard = async (duration) => {
  const res = await fetch(`${API_URL}?duration=${duration}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch leaderboard");
  return data.data; // Array of scores
};

export const saveScore = async (scorePayload, token) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(scorePayload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to save score");
  return data.data; // The saved score
};

export const getUserStats = async (token) => {
  const res = await fetch(`${API_URL}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch stats");
  return data.data; // Stats object
};

export const getPublicUserStats = async (username) => {
  const res = await fetch(`${API_URL}/user/${username}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch public stats");
  return data.data; // Returns { user, stats }
};
