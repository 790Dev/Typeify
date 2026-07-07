import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../../services/auth.api";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setErrorMsg(err.message || "Failed to verify email.");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-8 shadow-xl">
        <h2 className="mb-4 text-2xl font-bold text-accent">Email Verification</h2>
        
        {status === "verifying" && (
          <p className="text-sub-alt animate-pulse">Verifying your email, please wait...</p>
        )}

        {status === "success" && (
          <div className="flex flex-col gap-4">
            <p className="text-green-400">Your email has been successfully verified!</p>
            <button
              onClick={() => {
                navigate("/");
              }}
              className="mt-4 rounded-lg bg-accent py-2 font-semibold text-[#0e1116] transition hover:bg-accent-soft"
            >
              Go to Home to Login
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-4">
            <p className="text-red-400">{errorMsg}</p>
            <button
              onClick={() => {
                navigate("/");
              }}
              className="mt-4 rounded-lg bg-surface-2 py-2 font-semibold text-text transition hover:bg-surface-3"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
