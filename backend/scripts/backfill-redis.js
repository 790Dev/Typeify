import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Score from "../models/Score.js";
import { redisClient, connectRedis } from "../config/redis.js";
import connectDB from "../db/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const backfillRedis = async () => {
  await connectDB();
  await connectRedis();

  console.log("Starting Redis backfill...");

  const durations = [15, 30, 60, 120];

  for (const duration of durations) {
    console.log(`Processing leaderboard for ${duration}s...`);
    const redisKey = `leaderboard:${duration}`;
    
    // Clear existing key just in case
    await redisClient.del(redisKey);

    // Get the best score for each user for this duration
    const bestScores = await Score.aggregate([
      { $match: { duration } },
      { $sort: { wpm: -1 } },
      {
        $group: {
          _id: "$userId",
          bestScore: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$bestScore" } }
    ]);

    let count = 0;
    for (const score of bestScores) {
      const userIdStr = score.userId.toString();
      await redisClient.zAdd(redisKey, { score: score.wpm, value: userIdStr });
      count++;
    }

    console.log(`Added ${count} scores to ${redisKey}`);
  }

  console.log("Backfill complete!");
  process.exit(0);
};

backfillRedis().catch((err) => {
  console.error(err);
  process.exit(1);
});
