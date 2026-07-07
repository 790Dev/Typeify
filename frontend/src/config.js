// Base URL for the backend API.
// Set VITE_API_URL in production (e.g. on Vercel) to your Render backend URL.
// Falls back to localhost for local development.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";
