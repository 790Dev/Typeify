import express from "express";
import { createServer } from "http";
import dns from "dns";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket } from "./room.socket.js";
import { connectRedis } from "./config/redis.js";




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(cookieParser());

// Import all routes
import healthCheckRouter from "./routes/healthCheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import scoreRouter from "./routes/score.routes.js";
import textRouter from "./routes/text.routes.js";
import coachRouter from "./routes/coach.routes.js";

// Setup route prefixes
app.use("/api/v1/healthCheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/scores", scoreRouter);
app.use("/api/v1/text", textRouter);
app.use("/api/v1/coach", coachRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler Caught:", err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

connectDB()
  .then(() => connectRedis())
  .then(() => {
    initSocket(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`App is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed", err);
    process.exit(1);
  });
