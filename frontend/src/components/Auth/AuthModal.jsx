import React , { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Login from "./Login";
import Signup from "./Signup";

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal } = useAuth();
  const [mode, setMode] = useState("login");

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="panel relative w-[360px] p-6">
        {/* Close */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute right-4 top-3 text-sub-alt transition-colors hover:text-text"
        >
          ✕
        </button>

        {/* Tabs */}
        <div className="mb-6 flex justify-center gap-2">
          {["login", "signup"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-all ${
                mode === m
                  ? "bg-accent/10 text-accent"
                  : "text-sub-alt hover:text-text"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "login" ? <Login /> : <Signup />}
      </div>
    </div>
  );
};

export default AuthModal;
