import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/auth.api";

const inputClass =
  "p-2.5 rounded-lg bg-surface-2 border border-border text-text placeholder-sub-alt focus:outline-none focus:ring-2 focus:ring-accent/40 w-full text-center";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await resetPassword(token, newPassword);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to reset password.");
    }
  };

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-accent">Reset Password</h2>

        {status === "success" ? (
          <div className="flex flex-col gap-4">
            <p className="text-green-400">Your password has been successfully reset!</p>
            <button
              onClick={goHome}
              className="mt-4 rounded-lg bg-accent py-2 font-semibold text-[#0e1116] transition hover:bg-accent-soft"
            >
              Go to Home to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {status === "error" && (
              <p className="text-red-400 text-sm">{errorMsg}</p>
            )}

            <input
              type="password"
              placeholder="Enter new password (min 6 chars)"
              className={inputClass}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
              required
            />

            <button
              type="submit"
              disabled={status === "loading" || newPassword.length < 6}
              className="mt-2 rounded-lg bg-accent py-2 font-semibold text-[#0e1116] transition hover:bg-accent-soft disabled:opacity-50"
            >
              {status === "loading" ? "Resetting..." : "Set New Password"}
            </button>
            
            <button
              type="button"
              onClick={goHome}
              className="mt-2 text-sm text-sub-alt hover:text-text"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
