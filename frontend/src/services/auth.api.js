import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/v1/auth`;

export const signupUser = async (username, email, password) => {
  const res = await fetch(`${API_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data.data; // usually { user }
};

export const verifyEmail = async (verificationToken) => {
  const res = await fetch(`${API_URL}/verify-email/${verificationToken}`, {
    method: "GET",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Verification failed");
  return data.data;
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not send reset code");
  return data.data;
};

export const resetPassword = async (resetToken, newPassword) => {
  const res = await fetch(`${API_URL}/reset-password/${resetToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Could not reset password");
  return data.data;
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data.data; // { user, accessToken, refreshToken }
};

export const logoutUser = async (token) => {
  const res = await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.warn("Backend logout failed or session already expired");
  }
};

export const changePassword = async (oldPassword, newPassword, token) => {
  const res = await fetch(`${API_URL}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change password");
  return data.data;
};

export const refreshAccessToken = async (refreshToken) => {
  const res = await fetch(`${API_URL}/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Session expired");
  return data.data; // { accessToken, refreshToken }
};
