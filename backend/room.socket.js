// backend/room.socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { faker } from "@faker-js/faker"; // same library you already use
import { generateTypingText } from "./utils/ai.js";

const rooms = new Map();

// ── Same logic as your UseWords generatedWords() function ─────
function generateWords(
  count,
  includePunctuation = false,
  includeNumbers = false,
) {
  let words = faker.word.words(count).toLowerCase();

  if (includePunctuation) {
    const punctuation = [",", ".", "!", "?", ";", ":"];
    const wordsArray = words.split(" ");
    const wordsWithPunctuation = wordsArray.map((word, index) => {
      if (index > 0 && index % 3 === 0 && Math.random() > 0.5) {
        const randomPunct =
          punctuation[Math.floor(Math.random() * punctuation.length)];
        return word + randomPunct;
      }
      return word;
    });
    words = wordsWithPunctuation.join(" ");
  }

  if (includeNumbers) {
    const wordsArray = words.split(" ");
    const wordsWithNumbers = wordsArray.map((word, index) => {
      if (index > 0 && index % 4 === 0 && Math.random() > 0.6) {
        return Math.floor(Math.random() * 1000).toString();
      }
      return word;
    });
    words = wordsWithNumbers.join(" ");
  }

  return words;
}

function makeCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function serializeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    mode: room.mode,
    value: room.value,
    includePunctuation: room.includePunctuation,
    includeNumbers: room.includeNumbers,
    aiEnabled: room.aiEnabled,
    aiDifficulty: room.aiDifficulty,
    status: room.status,
    startedAt: room.startedAt,
    words: room.status === "running" ? room.words : null, // hidden until race starts
    players: Array.from(room.players.entries()).map(([id, p]) => ({
      id,
      score: room.scores?.get(id) || 0,
      ...p,
    })),
  };
}

function buildResults(room) {
  const players = Array.from(room.players.entries())
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (b.wpm !== a.wpm) return b.wpm - a.wpm;
      return b.accuracy - a.accuracy; // tie-breaker
    });
  return { code: room.code, players, winner: players[0] || null };
}

function handleRaceOver(room, io) {
  room.status = "finished";
  const results = buildResults(room);
  
  // Award score to winner(s)
  const p1 = results.players[0];
  if (p1) {
    const isTiedWithFirst = (p) => {
      if (p1.finished !== p.finished) return false;
      if (p1.finished) return p1.finishTime === p.finishTime;
      return p1.wpm === p.wpm && p1.accuracy === p.accuracy;
    };
    results.players.forEach(p => {
      if (isTiedWithFirst(p)) {
        room.scores.set(p.id, (room.scores.get(p.id) || 0) + 1);
      }
    });
  }

  io.to(room.code).emit("race-over", results);
  io.to(room.code).emit("room-updated", serializeRoom(room));

  // 30s Idle Timer for Host
  room.idleTimer = setTimeout(() => {
    const r = rooms.get(room.code);
    if (r && r.status === "finished") {
      io.to(r.code).emit("room-error", { message: "Host timed out. Room closed." });
      io.to(r.code).emit("room-closed");
      
      // Kick all sockets and leave room
      io.in(r.code).socketsJoin("kick"); 
      io.in(r.code).socketsLeave(r.code);

      rooms.delete(r.code);
    }
  }, 30000);
}

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("AUTH_REQUIRED"));
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.data.userId = decoded._id;
    socket.data.username = decoded.username || "Player";
    next();
  } catch {
    next(new Error("AUTH_INVALID"));
  }
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    const { userId, username } = socket.data;

    // ── CREATE ROOM ─────────────────────────────────────────
    socket.on(
      "create-room",
      ({
        mode,
        value,
        includePunctuation,
        includeNumbers,
        aiEnabled,
        aiDifficulty,
      }) => {
        const code = makeCode();

        const room = {
          code,
          hostId: socket.id,
          mode: mode || "words",
          value: value || 25,
          includePunctuation: includePunctuation || false,
          includeNumbers: includeNumbers || false,
          aiEnabled: aiEnabled || false,
          aiDifficulty: ["easy", "medium", "hard"].includes(aiDifficulty)
            ? aiDifficulty
            : "medium",
          words: "",
          status: "waiting",
          startedAt: null,
          players: new Map(),
          scores: new Map(),
          idleTimer: null,
          rematchTimer: null,
        };

        room.players.set(socket.id, {
          userId,
          username,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          finishTime: null,
          isReady: false,
          wantsRematch: false,
        });

        rooms.set(code, room);
        socket.join(code);
        socket.data.roomCode = code;

        socket.emit("room-created", serializeRoom(room));
      },
    );

    // ── JOIN ROOM ───────────────────────────────────────────
    socket.on("join-room", ({ code }) => {
      const room = rooms.get(code?.toUpperCase());

      if (!room) {
        socket.emit("room-error", { message: "Room not found" });
        return;
      }
      if (room.status !== "waiting") {
        socket.emit("room-error", { message: "Race already in progress" });
        return;
      }

      room.players.set(socket.id, {
        userId,
        username,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishTime: null,
        isReady: false,
        wantsRematch: false,
      });

      socket.join(room.code);
      socket.data.roomCode = room.code;

      io.to(room.code).emit("room-updated", serializeRoom(room));
    });

    // ── TOGGLE READY ────────────────────────────────────────
    socket.on("toggle-ready", () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.status !== "waiting") return;

      const player = room.players.get(socket.id);
      if (player) {
        player.isReady = !player.isReady;
        io.to(room.code).emit("room-updated", serializeRoom(room));
      }
    });

    // ── START RACE (host only) ──────────────────────────────
    socket.on("disconnect", () => {
      const room = rooms.get(socket.data.roomCode);
      if (room) {
        room.players.delete(socket.id);
        room.scores?.delete(socket.id);
      }
    });
    
    socket.on("start-race", async () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room) return;
      if (room.hostId !== socket.id) {
        socket.emit("room-error", { message: "Only the host can start" });
        return;
      }
      if (room.players.size < 2) {
        socket.emit("room-error", { message: "Need at least 2 players to start" });
        return;
      }
      
      const allReady = Array.from(room.players.values()).every((p) => p.isReady);
      if (!allReady) {
        socket.emit("room-error", { message: "All players must be ready to start" });
        return;
      }

      if (room.status !== "waiting") return;

      // Generate words ONCE on the server — same string sent to all players
      const wordCount = room.mode === "words" ? room.value : 60;

      if (room.aiEnabled) {
        try {
          room.words = await generateTypingText({
            count: wordCount,
            difficulty: room.aiDifficulty,
            includePunctuation: room.includePunctuation,
            includeNumbers: room.includeNumbers,
          });
        } catch (err) {
          // Gracefully fall back to local word generation if AI is unavailable.
          console.error("Room AI text failed, using faker:", err.message);
          room.words = generateWords(
            wordCount,
            room.includePunctuation,
            room.includeNumbers,
          );
        }
      } else {
        room.words = generateWords(
          wordCount,
          room.includePunctuation,
          room.includeNumbers,
        );
      }

      // Room may have been torn down while awaiting AI generation.
      if (!rooms.has(room.code)) return;
      
      room.status = "countdown";
      
      room.players.forEach((p) => {
        p.progress = 0;
        p.wpm = 0;
        p.accuracy = 100;
        p.finished = false;
        p.finishTime = null;
      });

      // Emit countdown phase
      io.to(room.code).emit("race-countdown", serializeRoom(room));

      // Wait 3 seconds before starting the race
      setTimeout(() => {
        const r = rooms.get(room.code);
        if (r && r.status === "countdown") {
          r.status = "running";
          r.startedAt = Date.now();
          io.to(r.code).emit("race-started", serializeRoom(r));

          // Time mode: server auto-ends the race
          if (r.mode === "time") {
            setTimeout(() => {
              const currentRoom = rooms.get(r.code);
              if (currentRoom && currentRoom.status === "running") {
                handleRaceOver(currentRoom, io);
              }
            }, r.value * 1000);
          }
        }
      }, 3000);
    });

    // ── TYPING PROGRESS ─────────────────────────────────────
    socket.on("typing-progress", ({ progress, wpm, accuracy }) => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.status !== "running") return;

      const player = room.players.get(socket.id);
      if (!player || player.finished) return;

      player.progress = Math.min(100, progress);
      player.wpm = Math.max(0, wpm || 0);
      player.accuracy = accuracy ?? 100;

      io.to(room.code).emit("progress-update", {
        playerId: socket.id,
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy,
      });

      // Words mode: player finished when progress hits 100
      if (room.mode === "words" && player.progress >= 100) {
        player.finished = true;
        player.finishTime = Date.now() - room.startedAt;

        io.to(room.code).emit("player-finished", {
          playerId: socket.id,
          username: player.username,
          wpm: player.wpm,
          accuracy: player.accuracy,
        });

        const allDone = [...room.players.values()].every((p) => p.finished);
        if (allDone) {
          handleRaceOver(room, io);
        }
      }
    });

    // ── NUDGE HOST ──────────────────────────────────────────
    socket.on("nudge-host", () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.status !== "finished") return;
      const player = room.players.get(socket.id);
      io.to(room.hostId).emit("host-nudged", { username: player?.username });
    });

    // ── INITIATE REMATCH (Host) ─────────────────────────────
    socket.on("initiate-rematch", () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.status !== "finished") return;
      if (room.hostId !== socket.id) return;
      
      clearTimeout(room.idleTimer);

      room.status = "rematch-voting";
      const hostP = room.players.get(socket.id);
      if (hostP) hostP.wantsRematch = true;

      io.to(room.code).emit("room-updated", serializeRoom(room));

      room.rematchTimer = setTimeout(() => {
        const r = rooms.get(room.code);
        if (r && r.status === "rematch-voting") {
          // Kick anyone who didn't accept
          r.players.forEach((p, id) => {
            if (!p.wantsRematch) {
              const client = io.sockets.sockets.get(id);
              if (client) {
                client.emit("room-error", { message: "You were removed for not accepting the rematch." });
                client.emit("room-closed");
                client.leave(r.code);
              }
              r.players.delete(id);
              r.scores?.delete(id);
            }
          });

          // Reset to lobby
          r.status = "waiting";
          r.words = "";
          r.startedAt = null;
          r.players.forEach((p) => {
            p.progress = 0;
            p.wpm = 0;
            p.accuracy = 100;
            p.finished = false;
            p.finishTime = null;
            p.isReady = false;
            p.wantsRematch = false;
          });
          io.to(r.code).emit("room-updated", serializeRoom(r));
        }
      }, 15000);
    });

    // ── ACCEPT REMATCH (Player) ─────────────────────────────
    socket.on("accept-rematch", () => {
      const room = rooms.get(socket.data.roomCode);
      if (!room || room.status !== "rematch-voting") return;

      const player = room.players.get(socket.id);
      if (player) {
        player.wantsRematch = true;
        io.to(room.code).emit("room-updated", serializeRoom(room));
      }
    });

    // ── LEAVE / DISCONNECT ──────────────────────────────────
    const removeFromRoom = () => {
      const code = socket.data.roomCode;
      if (!code) return;
      const room = rooms.get(code);
      if (!room) return;

      room.players.delete(socket.id);
      socket.leave(code);
      socket.data.roomCode = null;

      if (room.players.size === 0) {
        rooms.delete(code);
        return;
      }

      if (room.hostId === socket.id) {
        room.hostId = room.players.keys().next().value;
      }

      // If the leaver was the last person still racing, end the race.
      if (
        room.status === "running" &&
        [...room.players.values()].every((p) => p.finished)
      ) {
        room.status = "finished";
        io.to(room.code).emit("race-over", buildResults(room));
        return;
      }

      io.to(code).emit("room-updated", serializeRoom(room));
    };

    socket.on("leave-room", removeFromRoom);
    socket.on("disconnect", removeFromRoom);
  });
}
