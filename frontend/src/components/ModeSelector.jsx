import React from "react";
import { FaAt, FaHashtag, FaClock, FaFont, FaMagic } from "react-icons/fa";

const TOPICS = ["space", "nature", "history", "technology", "sports", "food"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const Toggle = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150
      ${
        active
          ? "text-accent"
          : "text-sub hover:text-sub-alt"
      }`}
  >
    <span className="text-[0.95em]">{icon}</span>
    <span>{label}</span>
  </button>
);

const Pill = ({ value, active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-md px-3 py-1.5 text-sm font-semibold tabular-nums transition-all duration-150
      ${
        active
          ? "text-accent"
          : "text-sub hover:text-sub-alt"
      }`}
  >
    {value}
  </button>
);

const Divider = () => <span className="mx-1 h-5 w-px bg-border" />;

const ModeSelector = ({
  onPunctuationChange,
  onNumbersChange,
  onTimeChange,
  onWordCountChange,
  onModeChange,
  selectedTime,
  selectedWordCount,
  isPunctuationEnabled,
  isNumbersEnabled,
  mode,
  aiEnabled,
  aiTopic,
  aiDifficulty,
  onAiToggle,
  onAiTopicChange,
  onAiDifficultyChange,
}) => {
  const counts = mode === "time" ? [15, 30, 60, 120] : [10, 25, 50, 100];
  const selectedCount = mode === "time" ? selectedTime : selectedWordCount;
  const onCountChange = mode === "time" ? onTimeChange : onWordCountChange;

  return (
    <div className="mb-10 flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface px-2.5 py-1.5 shadow-lg shadow-black/20">
        <Toggle
          icon={<FaAt />}
          label="punctuation"
          active={isPunctuationEnabled}
          onClick={() => onPunctuationChange(!isPunctuationEnabled)}
        />
        <Toggle
          icon={<FaHashtag />}
          label="numbers"
          active={isNumbersEnabled}
          onClick={() => onNumbersChange(!isNumbersEnabled)}
        />

        <Divider />

        <Toggle
          icon={<FaClock />}
          label="time"
          active={mode === "time"}
          onClick={() => onModeChange("time")}
        />
        <Toggle
          icon={<FaFont />}
          label="words"
          active={mode === "words"}
          onClick={() => onModeChange("words")}
        />

        <Divider />

        {counts.map((value) => (
          <Pill
            key={value}
            value={value}
            active={selectedCount === value}
            onClick={() => onCountChange(value)}
          />
        ))}

        <Divider />

        <Toggle
          icon={<FaMagic />}
          label="ai"
          active={aiEnabled}
          onClick={() => onAiToggle(!aiEnabled)}
        />
      </div>

      {/* AI options — revealed only when AI text is on */}
      {aiEnabled && (
        <div className="view-enter flex flex-wrap items-center justify-center gap-1 rounded-xl border border-accent/30 bg-surface px-2.5 py-1.5">
          <span className="px-2 text-xs uppercase tracking-widest text-sub-alt">
            topic
          </span>
          {TOPICS.map((t) => (
            <Pill
              key={t}
              value={t}
              active={aiTopic === t}
              onClick={() => onAiTopicChange(aiTopic === t ? "" : t)}
            />
          ))}
          <input
            value={TOPICS.includes(aiTopic) ? "" : aiTopic}
            onChange={(e) => onAiTopicChange(e.target.value)}
            placeholder="custom…"
            className="w-24 rounded-md bg-surface-2 px-2 py-1 text-sm text-text placeholder-sub focus:outline-none focus:ring-1 focus:ring-accent/40"
          />

          <Divider />

          <span className="px-2 text-xs uppercase tracking-widest text-sub-alt">
            level
          </span>
          {DIFFICULTIES.map((d) => (
            <Pill
              key={d}
              value={d}
              active={aiDifficulty === d}
              onClick={() => onAiDifficultyChange(d)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeSelector;
