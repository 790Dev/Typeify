import React, { createContext, useContext, useState, useEffect } from "react";
import { logoutUser, refreshAccessToken } from "../services/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    return localStorage.getItem("refreshToken") || null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);

  const login = (userData) => {
    const userInfo = userData.user;
    const userToken = userData.accessToken;
    const currentRefreshToken = userData.refreshToken;

    // ✅ Save to localStorage
    localStorage.setItem("user", JSON.stringify(userInfo));
    localStorage.setItem("token", userToken);
    if (currentRefreshToken) {
      localStorage.setItem("refreshToken", currentRefreshToken);
      setRefreshToken(currentRefreshToken);
    }

    setUser(userInfo);
    setToken(userToken);
    setShowAuthModal(false);
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch (err) {
        console.error("Backend logout issue:", err);
      }
    }

    // ✅ Clear localStorage on logout
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");

    setUser(null);
    setToken(null);
    setRefreshToken(null);
  };

  // Auto-refresh token in the background
  useEffect(() => {
    if (!refreshToken) return;

    // Refresh every 30 minutes
    const interval = setInterval(async () => {
      try {
        const data = await refreshAccessToken(refreshToken);
        if (data.accessToken) {
          setToken(data.accessToken);
          localStorage.setItem("token", data.accessToken);
        }
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
          localStorage.setItem("refreshToken", data.refreshToken);
        }
      } catch (err) {
        console.error("Session expired:", err);
        // If refresh fails, log the user out
        logout();
      }
    }, 30 * 60 * 1000); // 30 mins

    return () => clearInterval(interval);
  }, [refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
