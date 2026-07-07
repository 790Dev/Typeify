import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getLeaderboard } from "../services/score.api";
import { useAuth } from "../context/AuthContext";

const FILTERS = [15, 30, 60, 120];

const Leaderboard = () => {
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [data, setData] = useState([]);
  const [personalRank, setPersonalRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getLeaderboard(selectedDuration);
        // Backend now returns { leaderboard, currentUserRank }
        if (result.leaderboard) {
          setData(result.leaderboard);
          setPersonalRank(result.currentUserRank);
        } else {
          // Fallback if backend hasn't restarted yet
          setData(result);
          setPersonalRank(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDuration]);

  return (
    <div
      className="flex w-full text-text"
      style={{ minHeight: "calc(100vh - 88px)" }}
    >
      {/* ── Sidebar ── */}
      <div className="w-56 shrink-0 py-8 px-4 flex flex-col gap-2">
        <p className="text-sub-alt text-xs uppercase tracking-widest mb-4 px-2">
          Duration
        </p>
        {FILTERS.map((time) => (
          <button
            key={time}
            onClick={() => setSelectedDuration(time)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 w-full text-left
              ${
                selectedDuration === time
                  ? "bg-accent text-[#0e1116]"
                  : "text-sub-alt hover:bg-surface-2 hover:text-text"
              }`}
          >
            <span>🕐</span>
            time {time}
          </button>
        ))}
      </div>

      {/* ── Main card ── */}
      <div
        className="panel flex-1 overflow-auto px-10 py-8"
        style={{ margin: "16px 24px 24px 0" }}
      >
        {/* Title */}
        <h1 className="text-2xl font-bold text-text mb-8 tracking-wide">
          All-time English Time {selectedDuration} Leaderboard
        </h1>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center mt-32">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-sm mt-10">{error}</p>}

        {/* Table */}
        {!loading && !error && (
          <div className="w-full">
            {/* Header */}
            <div
              className="grid px-4 py-3 text-sub-alt text-xs uppercase tracking-widest border-b border-border mb-1"
              style={{
                gridTemplateColumns: "40px 1fr 120px 120px 140px",
              }}
            >
              <span>#</span>
              <span>name</span>
              <span className="text-right">wpm</span>
              <span className="text-right">accuracy</span>
              <span className="text-right">date</span>
            </div>

            {/* Rows */}
            <AnimatePresence mode="wait">
              {data.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sub-alt py-32 text-sm"
                >
                  No scores yet for {selectedDuration}s — be the first! 🏆
                </motion.div>
              ) : (
                data.map((entry, index) => (
                  <motion.div
                    key={entry._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`grid px-4 py-4 items-center rounded-lg transition-all duration-150 cursor-default ${index !== 0 && index % 2 === 0 ? 'bg-surface-2/30' : ''}`}
                    style={{
                      gridTemplateColumns: "40px 1fr 120px 120px 140px",
                      backgroundColor:
                        index === 0 ? "rgba(250,204,21,0.1)" : undefined,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(150,150,150,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        index === 0 ? "rgba(250,204,21,0.1)" : (index % 2 === 0 ? "" : ""))
                    }
                  >
                    {/* Rank */}
                    <span className="font-bold">
                      {index === 0 ? (
                        <span className="text-yellow-400 text-lg">👑</span>
                      ) : (
                        <span className="text-sub-alt text-sm">
                          {index + 1}
                        </span>
                      )}
                    </span>

                    {/* Username */}
                    <Link
                      to={`/profile/${entry.userId?.username}`}
                      className={`font-semibold text-sm flex items-center gap-3 cursor-pointer hover:underline hover:text-text transition-colors ${
                        index === 0 ? "text-accent" : "text-text"
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-xs text-sub shrink-0">
                        {entry.userId?.username?.[0]?.toUpperCase() ?? "?"}
                      </span>
                      {entry.userId?.username ?? "unknown"}
                    </Link>

                    {/* WPM */}
                    <span
                      className={`text-right font-bold text-sm ${
                        index === 0 ? "text-accent" : "text-sub"
                      }`}
                    >
                      {entry.wpm.toFixed(2)}
                    </span>

                    {/* Accuracy */}
                    <span
                      className={`text-right text-sm font-medium ${
                        entry.accuracy >= 95
                          ? "text-green-400"
                          : entry.accuracy >= 80
                            ? "text-yellow-300"
                            : "text-red-400"
                      }`}
                    >
                      {entry.accuracy.toFixed(2)}%
                    </span>

                    {/* Date */}
                    <span className="text-right text-xs text-sub-alt leading-relaxed">
                      {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <br />
                      {new Date(entry.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* Footer */}
            {data.length > 0 && (
              <div
                className="mt-6 pt-4 text-sub-alt text-xs flex justify-between border-t border-border"
              >
                <span>Showing top {data.length} results</span>
                <span>time {selectedDuration}s · english</span>
              </div>
            )}

            {/* Personal Rank Sticky Footer */}
            {isAuthenticated && personalRank && personalRank.rank > 10 && (
              <div
                className="mt-4 grid px-4 py-4 items-center rounded-lg border border-accent bg-surface-2"
                style={{
                  gridTemplateColumns: "40px 1fr 120px 120px 140px",
                }}
              >
                <span className="font-bold text-sub text-sm">
                  #{personalRank.rank}
                </span>
                <span className="font-semibold text-sm flex items-center gap-3 text-accent">
                  <span className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent shrink-0">
                    {user?.username?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  {user?.username ?? "You"} (You)
                </span>
                <span className="text-right font-bold text-sm text-sub">
                  {personalRank.wpm.toFixed(2)}
                </span>
                <span className="text-right text-sm font-medium text-sub-alt">
                  —
                </span>
                <span className="text-right text-xs text-sub-alt">
                  Your Best
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
