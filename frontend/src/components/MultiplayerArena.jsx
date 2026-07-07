import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import RaceRoom from "./RaceRoom";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const MultiplayerArena = () => {
  const { token } = useAuth();
  const socketRef = useRef(null);

  const [screen, setScreen] = useState("lobby");
  const [room, setRoom] = useState(null);
  const [results, setResults] = useState(null);
  const [players, setPlayers] = useState(new Map());
  const [error, setError] = useState("");
  const [rematchToast, setRematchToast] = useState("");
  const [countdownTicks, setCountdownTicks] = useState(null);

  const [mode, setMode] = useState("words");
  const [value, setValue] = useState(25);
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [joinCode, setJoinCode] = useState("");

  const modeOptions = mode === "time" ? [15, 30, 60, 120] : [10, 25, 50, 100];

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("room-created", (roomData) => {
      setRoom(roomData);
      setPlayers(buildPlayersMap(roomData));
      setScreen("room");
    });

    socket.on("room-updated", (roomData) => {
      setRoom(roomData);
      setPlayers(buildPlayersMap(roomData));
      
      if (roomData.status === "waiting") setScreen("room");
      else if (roomData.status === "rematch-voting") setScreen("rematch-voting");
      else if (roomData.status === "finished") setScreen("results");
    });

    socket.on("race-countdown", (roomData) => {
      setRoom(roomData);
      setPlayers(buildPlayersMap(roomData));
      setScreen("countdown");
      
      setCountdownTicks(3);
      let ticks = 3;
      const interval = setInterval(() => {
        ticks -= 1;
        if (ticks > 0) {
          setCountdownTicks(ticks);
        } else {
          clearInterval(interval);
          setCountdownTicks(null);
        }
      }, 1000);
    });

    socket.on("host-nudged", ({ username }) => {
      setRematchToast(`${username} is requesting a rematch!`);
      setTimeout(() => setRematchToast(""), 4000);
    });

    socket.on("room-closed", () => {
      setScreen("lobby");
      setRoom(null);
      setResults(null);
      setPlayers(new Map());
      setJoinCode("");
    });

    socket.on("race-started", (roomData) => {
      setRoom(roomData);
      setPlayers(buildPlayersMap(roomData));
      setScreen("race");
    });

    socket.on("progress-update", ({ playerId, progress, wpm, accuracy }) => {
      setPlayers((prev) => {
        const updated = new Map(prev);
        const p = updated.get(playerId);
        if (p) updated.set(playerId, { ...p, progress, wpm, accuracy });
        return updated;
      });
    });

    socket.on("player-finished", ({ playerId, wpm, accuracy }) => {
      setPlayers((prev) => {
        const updated = new Map(prev);
        const p = updated.get(playerId);
        if (p)
          updated.set(playerId, {
            ...p,
            finished: true,
            wpm,
            accuracy,
            progress: 100,
          });
        return updated;
      });
    });

    socket.on("race-over", (resultsData) => {
      setResults(resultsData);
      setScreen("results");
    });

    socket.on("room-error", ({ message }) => {
      setError(message);
      setTimeout(() => setError(""), 3000);
    });

    socket.on("connect_error", (err) => {
      if (err.message === "AUTH_REQUIRED" || err.message === "AUTH_INVALID") {
        setError("Authentication failed. Please log in again.");
      }
    });

    return () => socket.disconnect();
  }, [token]);

  const handleCreate = () => {
    socketRef.current?.emit("create-room", {
      mode,
      value,
      includePunctuation,
      includeNumbers,
      aiEnabled,
      aiDifficulty,
    });
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      setError("Enter a room code");
      return;
    }
    socketRef.current?.emit("join-room", {
      code: joinCode.trim().toUpperCase(),
    });
  };

  const handleLeave = () => {
    socketRef.current?.emit("leave-room");
    setScreen("lobby");
    setRoom(null);
    setResults(null);
    setPlayers(new Map());
    setJoinCode("");
  };

  if (screen !== "lobby") {
    return (
      <RaceRoom
        socket={socketRef.current}
        room={room}
        screen={screen}
        results={results}
        players={players}
        setPlayers={setPlayers}
        onLeave={handleLeave}
        error={error}
        rematchToast={rematchToast}
        countdownTicks={countdownTicks}
      />
    );
  }

  return (
    <div className="min-h-screen w-full py-10 bg-base">
      <h1
        className="text-text font-bold text-2xl mb-8"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Multiplayer Arena
      </h1>

      {error && (
        <div className="mb-6 px-4 py-2 bg-red-900/60 border border-red-500 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {/* Create Room */}
        <div className="rounded-xl p-6 bg-surface border border-border">
          <h2 className="text-text font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="text-green-500 text-xl">+</span> Create Room
          </h2>

          <div className="flex gap-2 mb-4">
            {["words", "time"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setValue(m === "time" ? 30 : 25);
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-accent text-[#0e1116]"
                    : "bg-surface-2 text-sub hover:text-text"
                }`}
              >
                {m === "time" ? "🕐 Time" : "A Words"}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {modeOptions.map((v) => (
              <button
                key={v}
                onClick={() => setValue(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  value === v
                    ? "text-accent font-bold"
                    : "text-sub hover:text-text"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setIncludePunctuation((p) => !p)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                includePunctuation
                  ? "text-accent"
                  : "text-sub hover:text-text"
              }`}
            >
              @ punctuation
            </button>
            <button
              onClick={() => setIncludeNumbers((n) => !n)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                includeNumbers
                  ? "text-accent"
                  : "text-sub hover:text-text"
              }`}
            >
              # numbers
            </button>
            <button
              onClick={() => setAiEnabled((a) => !a)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                aiEnabled
                  ? "text-accent"
                  : "text-sub hover:text-text"
              }`}
            >
              ✨ ai
            </button>
          </div>

          {aiEnabled && (
            <div className="flex gap-2 mb-5">
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setAiDifficulty(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    aiDifficulty === d
                      ? "bg-accent text-[#0e1116]"
                      : "bg-surface-2 text-sub hover:text-text"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleCreate}
            className="w-full py-2 rounded-lg font-semibold text-text transition-all active:scale-95 bg-green-600 hover:bg-green-500"
          >
            + Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className="rounded-xl p-6 bg-surface border border-border">
          <h2 className="text-text font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="text-blue-500 text-xl">→</span> Join Room
          </h2>

          <input
            className="w-full bg-base text-text rounded-lg px-4 py-2 text-sm outline-none border border-border focus:border-accent mb-4 tracking-widest uppercase font-mono"
            placeholder="Room Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />

          <button
            onClick={handleJoin}
            className="w-full py-2 rounded-lg font-semibold text-text transition-all active:scale-95 bg-blue-600 hover:bg-blue-500"
          >
            → Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

function buildPlayersMap(room) {
  if (!room?.players) return new Map();
  return new Map(room.players.map((p) => [p.id, p]));
}

export default MultiplayerArena;
