import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaCheckCircle, FaPlay, FaSignOutAlt, FaUsers, FaTrophy, FaCrown, FaCopy, FaCheck, FaRedo } from "react-icons/fa";
import UserTypings from "./UserTypings";

const RaceRoom = ({
  socket,
  room,
  screen,
  results,
  players,
  setPlayers,
  onLeave,
  error,
  rematchToast,
  countdownTicks,
}) => {
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(room?.value || 30);
  const [hostTimer, setHostTimer] = useState(30);
  const [votingTimer, setVotingTimer] = useState(15);
  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  // Dedupe a backspace that may arrive via both keydown and beforeinput.
  const lastKeydownDeleteRef = useRef(0);
  const lastInputDeleteRef = useRef(0);
  const myId = socket?.id;

  const [copied, setCopied] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleStart = () => {
    if ([...players.values()].length < 2) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
      return;
    }
    const allReady = [...players.values()].every(p => p.isReady);
    if (!allReady) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
      return;
    }
    socket?.emit("start-race");
  };

  const handleCopy = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const focusInput = () => inputRef.current?.focus();

  // Start timer when race begins
  useEffect(() => {
    if (screen === "race" && room?.mode === "time") {
      let t = room.value;
      setTimeLeft(t);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        t -= 1;
        setTimeLeft(t);
        if (t <= 0) clearInterval(timerRef.current);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [screen]);

  // Reset typed when race starts
  useEffect(() => {
    if (screen === "race") setTyped("");
  }, [screen]);

  // Timers for post-game states
  useEffect(() => {
    if (screen === "results") {
      setHasRequestedRematch(false);
      let t = 30;
      setHostTimer(t);
      const interval = setInterval(() => {
        t -= 1;
        setHostTimer(t > 0 ? t : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === "rematch-voting") {
      let t = 15;
      setVotingTimer(t);
      const interval = setInterval(() => {
        t -= 1;
        setVotingTimer(t > 0 ? t : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  // Primary capture: `beforeinput` on the focused hidden input. This works
  // reliably across desktop AND mobile keyboards (focusing the input also
  // summons the on-screen keyboard on mobile, unlike a window keydown listener).
  useEffect(() => {
    if (screen !== "race") return;
    const el = inputRef.current;
    if (!el) return;

    const handleBeforeInput = (e) => {
      const { inputType, data } = e;
      if (
        inputType === "insertText" ||
        inputType === "insertCompositionText" ||
        inputType === "insertFromPaste"
      ) {
        if (data) {
          let next = "";
          for (const ch of data) {
            if (ch === "\n" || ch === "\r") continue;
            next += ch;
          }
          if (next) setTyped((prev) => prev + next);
        }
      } else if (
        inputType === "deleteContentBackward" ||
        inputType === "deleteWordBackward"
      ) {
        if (Date.now() - lastKeydownDeleteRef.current > 60) {
          lastInputDeleteRef.current = Date.now();
          setTyped((prev) => prev.slice(0, -1));
        }
      }
      if (e.cancelable) e.preventDefault();
    };

    el.addEventListener("beforeinput", handleBeforeInput);
    return () => el.removeEventListener("beforeinput", handleBeforeInput);
  }, [screen]);

  // Backspace fires reliably via keydown on every platform (mobile virtual
  // keyboards often don't emit a `beforeinput` delete on an empty input).
  useEffect(() => {
    if (screen !== "race") return;

    const handleKey = ({ key }) => {
      if (key !== "Backspace") return;
      if (Date.now() - lastInputDeleteRef.current > 60) {
        lastKeydownDeleteRef.current = Date.now();
        setTyped((prev) => prev.slice(0, -1));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [screen]);

  // Keep the hidden input focused so the mobile keyboard stays open.
  useEffect(() => {
    if (screen === "race") focusInput();
  }, [screen]);

  // Emit progress on every keystroke
  useEffect(() => {
    if (screen !== "race" || !room?.words) return;

    const words = room.words;

    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === words[i]) correct++;
    }

    const progress = Math.min(
      100,
      Math.round((correct / words.length) * 100),
    );

    const accuracy =
      typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
      
    // Use server's exact start time for flawless true WPM calculation,
    // fallback to naive time if not present.
    const elapsedMin = room?.startedAt
      ? Math.max((Date.now() - room.startedAt) / 1000 / 60, 1 / 60)
      : Math.max((room.mode === "time" ? (room.value - timeLeft) : (typed.length / 5)) / 60, 1 / 60);
    const wpm = Math.round(correct / 5 / elapsedMin);

    socket?.emit("typing-progress", { progress, wpm, accuracy });

    // Update own bar instantly without waiting for server echo
    setPlayers((prev) => {
      const updated = new Map(prev);
      const me = updated.get(myId);
      if (me) updated.set(myId, { ...me, progress, wpm, accuracy });
      return updated;
    });
  }, [typed]);

  // ── RESULTS ───────────────────────────────────────────────
  if (screen === "results" && results) {
    const sorted = [...results.players].sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      return b.accuracy - a.accuracy; // tie-breaker
    });

    const p1 = sorted[0];
    const isTiedWithFirst = (p) => {
      if (!p1 || !p) return false;
      if (p1.finished !== p.finished) return false;
      if (p1.finished) return p1.finishTime === p.finishTime;
      return p1.wpm === p.wpm && p1.accuracy === p.accuracy;
    };
    const isDraw = sorted.length > 1 && isTiedWithFirst(sorted[1]);

    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-yellow-400 text-3xl font-bold font-mono">
            {isDraw ? "It's a draw!" : `${p1?.username} wins!`}
          </h2>
          <p className="text-sub-alt text-sm mt-1">
            {p1?.wpm} WPM · {p1?.accuracy}% ACC
          </p>
        </div>

        <div
          className="rounded-xl p-6 mb-6 bg-surface border border-border"
        >
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 mb-4 last:mb-0">
              <div className="text-sub-alt font-mono w-5 text-right text-sm">
                {i + 1}
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-text flex-shrink-0"
                style={{ backgroundColor: avatarColor(p.username) }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-text text-sm font-medium">
                  {p.username}
                </div>
                <div className="text-green-400 text-xs">
                  {p.wpm} WPM · {p.accuracy}% ACC
                </div>
              </div>
              <div className="ml-4 mr-2 text-center">
                <div className="text-sub-alt text-[10px] uppercase font-bold tracking-wider mb-0.5">Wins</div>
                <div className="text-text font-mono">{p.score || 0}</div>
              </div>
              <div className="w-8 flex justify-center">
                {isTiedWithFirst(p) && <span className="text-yellow-400 text-xl">👑</span>}
              </div>
            </div>
          ))}
        </div>

        {rematchToast && (
          <div className="text-center text-sm font-semibold text-blue-400 bg-blue-900/30 py-2 rounded-lg mb-4 animate-pulse">
            {rematchToast}
          </div>
        )}

        <div className="flex gap-4">
          {room?.hostId === myId ? (
            <button
              onClick={() => socket?.emit("initiate-rematch")}
              className="flex-1 py-3 rounded-lg font-semibold text-text transition-all active:scale-95 bg-blue-600 hover:bg-blue-500 shadow-lg"
            >
              Start Rematch ({hostTimer}s)
            </button>
          ) : (
            <button
              onClick={() => {
                if (!hasRequestedRematch) {
                  socket?.emit("nudge-host");
                  setHasRequestedRematch(true);
                }
              }}
              disabled={hasRequestedRematch}
              className={`flex-1 py-3 rounded-lg font-semibold text-text transition-all active:scale-95 shadow-lg ${hasRequestedRematch ? "bg-gray-600 cursor-not-allowed opacity-80" : "bg-blue-800 hover:bg-blue-700"}`}
            >
              {hasRequestedRematch ? "Requested" : "Request Rematch"}
            </button>
          )}

          <button
            onClick={onLeave}
            className="flex-1 py-3 rounded-lg font-semibold text-black transition-all active:scale-95"
            style={{ backgroundColor: "#2ea043" }}
          >
            Back to Arena
          </button>
        </div>
      </div>
    );
  }

  // ── REMATCH VOTING ─────────────────────────────────────────
  if (screen === "rematch-voting") {
    const playerList = [...players.values()];
    const myPlayer = players.get(myId);

    return (
      <div className="py-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-text text-3xl font-bold mb-2">Rematch Initiated!</h2>
          <p className="text-sub">Host wants to play again. Are you ready?</p>
        </div>

        <div className="rounded-xl p-6 mb-8 bg-surface border border-border">
          <h3 className="text-text font-semibold mb-4">Players Ready</h3>
          <div className="space-y-4">
            {playerList.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-text flex-shrink-0"
                    style={{ backgroundColor: avatarColor(p.username) }}
                  >
                    {p.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-text text-sm font-medium">{p.username}</span>
                </div>
                <div>
                  {p.wantsRematch ? (
                    <span className="text-green-400 text-sm font-medium flex items-center gap-1"><FaCheckCircle /> Accepted</span>
                  ) : (
                    <span className="text-sub-alt text-sm italic">Waiting...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!myPlayer?.wantsRematch ? (
          <div className="flex gap-4">
            <button
              onClick={() => socket?.emit("accept-rematch")}
              className="flex-1 py-4 rounded-lg font-semibold text-black bg-green-500 hover:bg-green-400 transition-all active:scale-95 shadow-lg"
            >
              Accept Rematch ({votingTimer}s)
            </button>
            <button
              onClick={onLeave}
              className="flex-1 py-4 rounded-lg font-semibold text-text bg-red-600 hover:bg-red-500 transition-all active:scale-95 shadow-lg"
            >
              Decline & Leave
            </button>
          </div>
        ) : (
          <div className="text-center text-green-400 font-semibold p-4 rounded-lg bg-green-900/20 border border-green-800">
            Waiting for other players...
          </div>
        )}
      </div>
    );
  }

  // ── RACE & COUNTDOWN ──────────────────────────────────────
  if (screen === "race" || screen === "countdown") {
    const sortedPlayers = [...players.values()].sort(
      (a, b) => b.progress - a.progress,
    );

    return (
      <div className="py-6">
        {screen === "countdown" && countdownTicks && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md">
            <span className="text-[12rem] font-black text-text animate-ping drop-shadow-2xl">
              {countdownTicks}
            </span>
          </div>,
          document.body
        )}

        <div
          className="rounded-xl p-5 mb-6 bg-surface border border-border"
        >
          {sortedPlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-3 mb-4 last:mb-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-text flex-shrink-0"
                style={{ backgroundColor: avatarColor(p.username) }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-text text-sm">{p.username}</span>
                  <span className="text-green-400 text-xs font-mono">
                    {p.wpm} WPM · {p.accuracy}% ACC
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full"
                  style={{ backgroundColor: "#30363d" }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${p.progress}%`,
                      backgroundColor: p.id === myId ? "#2ea043" : "#1d6fa4",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          {room?.mode === "time" ? (
            <h2 className="text-yellow-400 font-semibold text-xl">
              Time: {timeLeft}
            </h2>
          ) : (
            <span />
          )}
          <button
            onClick={onLeave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text transition-all active:scale-95"
            style={{ backgroundColor: "#b91c1c" }}
          >
            ⤶ Leave Room
          </button>
        </div>

        <div
          onClick={screen === "race" ? focusInput : undefined}
          className={`relative rounded-xl p-5 ${screen === "race" ? "cursor-text" : ""} bg-surface border border-border`}
        >
          {/* Hidden input — focusing it opens the mobile keyboard and
              captures typing via beforeinput. */}
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Typing input"
            value=""
            onChange={() => { }}
            className="absolute inset-0 z-20 h-full w-full cursor-text opacity-0"
            style={{ caretColor: "transparent" }}
          />
          <UserTypings
            words={room?.words || ""}
            userInput={typed}
            className="text-2xl leading-relaxed"
          />
        </div>
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────
  const playerList = [...players.values()];
  const isHost = room?.hostId === myId;

  return (
    <div className="py-10 max-w-3xl">
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/60 border border-red-500 text-red-300 rounded-lg font-medium shadow-md">
          {error}
        </div>
      )}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-text font-bold text-xl font-mono">
            {room?.mode === "time"
              ? `Room | ${room?.value}s`
              : `Room | ${room?.value} words`}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sub-alt text-sm"># Room Code:</span>
            <span className="text-sub font-mono tracking-widest text-sm">
              {room?.code}
            </span>
            <button
              onClick={handleCopy}
              className="text-sub-alt hover:text-sub text-xs transition-colors"
              title="Copy Room Code"
            >
              {copied ? "✅" : "📋"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isHost ? (
            <div className="relative">
              <div
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-red-600 text-text text-xs font-semibold rounded shadow-lg pointer-events-none transition-opacity duration-[1500ms] ${showWarning ? "opacity-100" : "opacity-0"
                  }`}
              >
                Need at least 2 players & everyone ready
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
              </div>
              <button
                onClick={handleStart}
                className={`px-6 py-2 rounded-lg font-semibold text-black bg-[#2ea043] transition-all active:scale-95 ${playerList.length < 2 || !playerList.every(p => p.isReady) ? "opacity-60 saturate-50" : "hover:brightness-110"
                  }`}
              >
                ▶ Start
              </button>
            </div>
          ) : (
            <p className="text-sub-alt text-sm">Waiting for host to start…</p>
          )}

          <button
            onClick={() => socket?.emit("toggle-ready")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold text-black transition-all active:scale-95 flex items-center justify-center gap-2 ${players.get(myId)?.isReady ? "bg-green-400" : "bg-gray-400"
              }`}
          >
            {players.get(myId)?.isReady ? <><FaCheckCircle /> Ready</> : "Ready Up"}
          </button>

          <button
            onClick={onLeave}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text transition-all active:scale-95"
            style={{ backgroundColor: "#b91c1c" }}
          >
            ⤶ Leave
          </button>
        </div>
      </div>

      <div
        className="rounded-xl p-6 bg-surface border border-border"
      >
        <h3 className="text-text font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-400">👥</span> Players ({playerList.length}
          )
        </h3>
        <div className="space-y-4">
          {playerList.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-text"
                style={{ backgroundColor: avatarColor(p.username) }}
              >
                {p.username[0]?.toUpperCase()}
              </div>
              <div>
                <div className="text-text text-sm font-medium">
                  {p.username}
                </div>
                {p.id === room?.hostId && (
                  <div className="text-green-400 text-xs mt-0.5">Host</div>
                )}
              </div>

              <div className="ml-auto">
                {p.isReady && (
                  <FaCheckCircle className="text-xl text-green-400" title="Ready" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AVATAR_COLORS = [
  "#e05c5c",
  "#e08a5c",
  "#a3e05c",
  "#5ce09e",
  "#5cb8e0",
  "#8a5ce0",
  "#e05ca3",
];
function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default RaceRoom;
