import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { FaMagic } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getCoaching } from "../services/coach.api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const TypingChart = ({
  wpmData,
  errors,
  totalTyped,
  accuracy,
  consistency = 0,
  onRestart,
  mode,
  selectedTime,
  selectedWordCount,
  mistakes = {},
}) => {
  const { user, isAuthenticated, setShowAuthModal } = useAuth();
  const { isLightMode } = useTheme();
  const safeWpmData = wpmData || [];

  // Get the very last WPM value for the big display
  const finalWpm = safeWpmData.length > 0 ? safeWpmData[safeWpmData.length - 1].wpm : 0;

  // AI Coach state
  const [coach, setCoach] = useState({ status: "idle", tips: [], error: "" });

  const runCoach = async () => {
    setCoach({ status: "loading", tips: [], error: "" });
    
    // Sort mistakes to get the top 5 worst characters for this specific test
    const topMistakes = Object.entries(mistakes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([char]) => char);

    try {
      const tips = await getCoaching({
        wpm: finalWpm,
        accuracy: Math.round(typeof accuracy === "number" ? accuracy : 100),
        consistency,
        raw: totalTyped,
        errors,
        mode,
        duration: mode === "time" ? selectedTime : null,
        wordCount: mode === "words" ? selectedWordCount : null,
        wpmSeries: safeWpmData.map((d) => d.wpm),
        topMistakes, // Pass directly to AI
      });
      setCoach({ status: "done", tips, error: "" });
    } catch (err) {
      setCoach({ status: "error", tips: [], error: err.message });
    }
  };
  
  const correctChars = Math.max(0, totalTyped - errors);
  const formattedAccuracy = typeof accuracy === "number" ? accuracy.toFixed(0) : "100";

  const chartData = {
    // X-Axis: Use the 'second' field directly
    labels: safeWpmData.map((d) => d.second),
    datasets: [
      {
        label: "WPM",
        data: safeWpmData.map((d) => d.wpm),
        borderColor: "#e2b714",
        backgroundColor: "rgba(226, 183, 20, 0.12)",
        borderWidth: 3,
        pointRadius: 2,
        pointBackgroundColor: "#e2b714",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const gridColor = isLightMode ? "rgba(0,0,0,0.06)" : "#262e3b";
  const textColor = isLightMode ? "#64748b" : "#6b7688";

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Time (s)", color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      y: {
        title: { display: true, text: "WPM", color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColor },
        beginAtZero: true,
      },
    },
  };

  const Stat = ({ label, value, sub }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-sub-alt">
        {label}
      </span>
      <span className="font-mono text-3xl font-semibold tabular-nums text-accent">
        {value}
      </span>
      {sub && <span className="text-xs text-sub">{sub}</span>}
    </div>
  );

  return (
    <div className="panel mx-auto w-full max-w-6xl p-6">
      <div className="flex flex-col">
        {/* HERO STATS */}
        <div className="grid grid-cols-1 gap-4 border-b border-border pb-3 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex gap-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-sub-alt">
                wpm
              </div>
              <div className="font-mono text-5xl font-bold leading-none text-accent">
                {finalWpm}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-sub-alt">
                accuracy
              </div>
              <div className="font-mono text-5xl font-bold leading-none text-accent">
                {formattedAccuracy}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:justify-items-end">
            <Stat label="raw" value={totalTyped} />
            <Stat
              label="characters"
              value={`${correctChars}/${errors}`}
              sub="correct / errors"
            />
            <Stat
              label={mode === "time" ? "time" : "words"}
              value={mode === "time" ? `${selectedTime}s` : `${selectedWordCount}`}
            />
            <Stat label="mode" value={mode} />
          </div>
        </div>

        {/* CHART AREA - fixed height so buttons always stay visible */}
        <div className="mt-3" style={{ height: '45vh' }}>
          <Line data={chartData} options={chartOptions} />
        </div>

        {/* BOTTOM ROW: AI Coach + Restart + Login */}
        <div className="flex items-center justify-between mt-3 gap-4">
          {/* AI COACH */}
          <div className="flex-1">
            {coach.status === "idle" && (
              <button
                onClick={runCoach}
                className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-semibold text-accent transition hover:bg-accent/20"
              >
                <FaMagic /> Get AI coaching
              </button>
            )}

            {coach.status === "loading" && (
              <div className="flex items-center gap-3 text-sub-alt text-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                analyzing your run…
              </div>
            )}

            {coach.status === "error" && (
              <div className="text-sm text-sub-alt">
                Coaching unavailable.{" "}
                <button
                  onClick={runCoach}
                  className="text-accent underline-offset-4 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {coach.status === "done" && (
              <div className="text-sm text-accent font-semibold flex items-center gap-2">
                <FaMagic /> AI tips ready — scroll down to view
              </div>
            )}
          </div>

          {/* RESTART */}
          <button
            onClick={onRestart}
            title="Next test"
            aria-label="Next test"
            className="grid h-10 w-14 place-items-center rounded-xl text-2xl text-sub-alt transition-all duration-200 hover:bg-surface-2 hover:text-accent"
          >
            ↻
          </button>

          {/* LOGIN PROMPT */}
          {!isAuthenticated && (
            <button
              className="text-sm text-sub-alt underline-offset-4 transition-colors hover:text-accent hover:underline"
              onClick={() => setShowAuthModal(true)}
            >
              🔒 Log in to save
            </button>
          )}
        </div>

        {/* AI COACH EXPANDED TIPS (only when done) */}
        {coach.status === "done" && (
          <div className="mt-2 overflow-y-auto max-h-28 rounded-xl border border-border bg-surface-2 p-3">
            <ul className="space-y-1">
              {coach.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-text">
                  <span className="text-accent shrink-0">▹</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingChart;