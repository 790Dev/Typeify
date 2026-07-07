import React from "react";
import { motion } from "framer-motion";

const Results = ({
  state,
  errors,
  accuracyPercentage,
  total,
  className,
  wpmHistory,
  restart,
  mode,
  selectedTime,
  selectedWordCount,
}) => {
  if (state !== "finish") return null;

  const initial = { opacity: 0 };
  const animate = { opacity: 1 };
  const duration = { duration: 0.3 };

  // Calculate final WPM from history or fallback to 0
  const finalWpm = wpmHistory.length > 0 ? wpmHistory[wpmHistory.length - 1].wpm : 0;

  return (
    <div className={`flex flex-col items-center p-6 bg-surface rounded-xl ${className}`}>
      <motion.ul className="flex flex-col items-center text-yellow-400 space-y-3">
        <motion.li className="text-3xl font-bold mb-4" initial={initial} animate={animate}>
          Results
        </motion.li>

        <motion.li className="text-lg text-sub" initial={initial} animate={animate} transition={{ delay: 0.2 }}>
          Mode: {mode === "time" ? `${selectedTime}s` : `${selectedWordCount} words`}
        </motion.li>

        <motion.li className="text-5xl font-bold text-yellow-500" initial={initial} animate={animate} transition={{ delay: 0.4 }}>
          {finalWpm} <span className="text-xl">WPM</span>
        </motion.li>

        <motion.li className="text-2xl" initial={initial} animate={animate} transition={{ delay: 0.6 }}>
          Accuracy: <span className="text-text">{accuracyPercentage}%</span>
        </motion.li>

        <div className="flex gap-8 mt-4">
          <motion.li className="text-center" initial={initial} animate={animate} transition={{ delay: 0.8 }}>
            <div className="text-sub-alt text-xs">ERRORS</div>
            <div className="text-red-500 text-xl font-bold">{errors}</div>
          </motion.li>
          <motion.li className="text-center" initial={initial} animate={animate} transition={{ delay: 1.0 }}>
            <div className="text-sub-alt text-xs">CHARACTERS</div>
            <div className="text-text text-xl font-bold">{total}</div>
          </motion.li>
        </div>
      </motion.ul>

      <motion.button
        className="mt-8 px-10 py-3 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-400 transition-all active:scale-95"
        initial={initial}
        animate={animate}
        transition={{ delay: 1.2 }}
        onClick={restart}
      >
        Try Again
      </motion.button>
    </div>
  );
};

export default Results;