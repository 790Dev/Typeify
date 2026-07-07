import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getUserStats, getPublicUserStats } from "../services/score.api";
import { changePassword } from "../services/auth.api";

const StatCard = ({ label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col gap-1 rounded-2xl border border-border px-8 py-6 transition-colors hover:border-accent/30"
    style={{ background: "var(--color-surface-2)" }}
  >
    <span className="text-xs uppercase tracking-widest text-sub-alt">
      {label}
    </span>
    <span className="font-mono text-3xl font-extrabold tabular-nums text-accent">
      {value}
    </span>
  </motion.div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password form state
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [pwdState, setPwdState] = useState({ oldPassword: "", newPassword: "" });
  const [pwdStatus, setPwdStatus] = useState({ loading: false, error: "", success: "" });

  const { username } = useParams(); // For public profiles
  const isOwnProfile = !username || (user && user.username === username);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        if (username) {
          const data = await getPublicUserStats(username);
          setStats(data.stats);
          // Overwrite the 'user' display object for this page with the public user
          setPublicUser(data.user);
        } else if (token) {
          const data = await getUserStats(token);
          setStats(data);
          setPublicUser(user); // Fallback to logged-in user
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token, username, user]);

  const [publicUser, setPublicUser] = useState(user);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwdState.oldPassword || !pwdState.newPassword) {
      setPwdStatus({ loading: false, error: "Both fields are required", success: "" });
      return;
    }
    try {
      setPwdStatus({ loading: true, error: "", success: "" });
      await changePassword(pwdState.oldPassword, pwdState.newPassword, token);
      setPwdStatus({ loading: false, error: "", success: "Password updated successfully!" });
      setPwdState({ oldPassword: "", newPassword: "" });
      setTimeout(() => {
        setShowPwdForm(false);
        setPwdStatus({ loading: false, error: "", success: "" });
      }, 3000);
    } catch (err) {
      setPwdStatus({ loading: false, error: err.message || "Failed to update", success: "" });
    }
  };

  // Prevent rendering private profile if not logged in and no username is specified
  if (!username && !user) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-sub">
        Please log in to view your profile.
      </div>
    );
  }

  return (
    <div className="px-6 pb-6">
      <div className="panel w-full p-10">
        {/* Top Row — Avatar + Name + Logout */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center text-3xl font-bold text-accent">
              {publicUser?.username?.[0]?.toUpperCase() ?? "?"}
            </div>

            {/* Name + join date */}
            <div>
              <h2 className="text-text text-3xl font-extrabold">
                {publicUser?.username}
              </h2>
              <p className="text-sub text-sm mt-1">
                Joined{" "}
                {publicUser?.createdAt
                  ? new Date(publicUser.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "recently"}
              </p>
            </div>
          </div>

          {/* Actions (Only show if own profile) */}
          {isOwnProfile && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPwdForm(!showPwdForm)}
                className="px-4 py-2 rounded-lg bg-surface-2 text-sub hover:text-text transition-all duration-200 text-sm font-semibold border border-border hover:border-sub"
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-surface-2 text-sub hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 text-sm font-semibold border border-border hover:border-red-500/40"
              >
                <span>⎋</span> Logout
              </button>
            </div>
          )}
        </div>

        {/* Change Password Modal */}
        {createPortal(
          <AnimatePresence>
            {showPwdForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md px-4"
                onClick={() => setShowPwdForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-surface border border-border p-8 rounded-2xl max-w-md w-full shadow-2xl relative"
                >
                  <div className="flex justify-center mb-6">
                    <h3 className="text-xl font-bold text-text m-0">Change Password</h3>
                  </div>
                  
                  <form onSubmit={handlePasswordChange}>
                    {pwdStatus.error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg">{pwdStatus.error}</p>}
                    {pwdStatus.success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 p-3 rounded-lg">{pwdStatus.success}</p>}
                    
                    <div className="flex flex-col gap-5">
                      <div>
                        <label className="block text-sm font-medium text-sub mb-1">Current Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={pwdState.oldPassword}
                          onChange={(e) => setPwdState({ ...pwdState, oldPassword: e.target.value })}
                          className="w-full bg-base border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-sub mb-1">New Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={pwdState.newPassword}
                          onChange={(e) => setPwdState({ ...pwdState, newPassword: e.target.value })}
                          className="w-full bg-base border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={pwdStatus.loading}
                        className="w-full bg-accent hover:opacity-80 text-[#0e1116] font-bold py-3 rounded-lg transition-colors mt-2 disabled:opacity-50"
                      >
                        {pwdStatus.loading ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </motion.div>
                
                {/* Back button outside dialog */}
                <button
                  onClick={() => setShowPwdForm(false)}
                  className="mt-6 text-sub hover:text-text font-medium transition-colors"
                >
                  ← Back to Profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Tests Completed"
              value={stats?.testsCompleted ?? 0}
            />
            <StatCard label="Best WPM" value={stats?.bestWpm ?? 0} />
            <StatCard label="Avg WPM" value={stats?.avgWpm ?? 0} />
            <StatCard
              label="Avg Accuracy"
              value={`${stats?.avgAccuracy ?? 0}%`}
            />
          </div>
        )}

        {/* Recent scores CTA */}
        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
          <span className="text-sub text-sm">
            Your best scores appear on the leaderboard
          </span>
          <button
            onClick={() => navigate("/leaderboard")}
            className="text-accent text-sm font-semibold hover:opacity-80 transition-all"
          >
            View Leaderboard →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
