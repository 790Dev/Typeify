import React, { useState } from "react";
import { signupUser } from "../../services/auth.api";

const inputClass =
  "p-2.5 rounded-lg bg-surface-2 border border-border text-text placeholder-sub-alt focus:outline-none focus:ring-2 focus:ring-accent/40";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await signupUser(username, email, password);
      setSuccess(true);
      setInfo(`Registration successful! We sent a verification link to ${email}. Please check your inbox and click the link to verify your account.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h3 className="text-lg font-bold text-accent">Verify Your Email</h3>
        <p className="text-sm text-sub-alt">{info}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} className="flex flex-col gap-4">
      {error && (
        <div className="text-center text-sm text-red-400">{error}</div>
      )}

      <input
        placeholder="Username"
        className={inputClass}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="email"
        placeholder="Email"
        className={inputClass}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password (min 6 chars)"
        className={inputClass}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent py-2 font-semibold text-[#0e1116] transition hover:bg-accent-soft disabled:opacity-50"
      >
        {loading ? "Registering…" : "Create Account"}
      </button>
    </form>
  );
};

export default Signup;
