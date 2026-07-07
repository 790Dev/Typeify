import mongoose from "mongoose";
import Score from "../models/Score.js";
import { User } from "../models/User.js";
import { redisClient } from "../config/redis.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

const saveScore = asyncHandler(async (req, res) => {
  const { wpm, accuracy, raw, consistency, duration, mode, mistakes } = req.body;

  // words mode has no duration so don't pass it if null
  const scoreData = {
    userId: req.user._id,
    wpm,
    accuracy,
    raw,
    consistency,
    mode,
    ...(duration !== null && { duration }),
  };

  const score = await Score.create(scoreData);
  
  if (!score) {
    throw new ApiError(500, "Failed to save score");
  }

  // Update Redis leaderboard
  if (duration) {
    try {
      const redisKey = `leaderboard:${duration}`;
      const userIdStr = req.user._id.toString();
      
      const currentRedisScore = await redisClient.zScore(redisKey, userIdStr);
      if (currentRedisScore === null || wpm > currentRedisScore) {
        await redisClient.zAdd(redisKey, { score: wpm, value: userIdStr });
      }
    } catch (err) {
      console.error("Redis leaderboard update error:", err);
    }
  }

  return res.status(201).json(new ApiResponse(201, score, "Score saved successfully"));
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const duration = Number(req.query.duration);

  if (![15, 30, 60, 120].includes(duration)) {
    throw new ApiError(400, "Invalid duration");
  }

  const redisKey = `leaderboard:${duration}`;
  let leaderboard = [];
  let currentUserRank = null;
  // Use the token user if available, the middleware might not block unauthenticated users here,
  // but if it does, req.user will be populated.
  const userIdStr = req.user ? req.user._id.toString() : null;

  try {
    // 1. Fetch top 10 from Redis
    const topUsers = await redisClient.zRangeWithScores(redisKey, 0, 9, { REV: true });
    
    if (topUsers.length > 0) {
      const userIds = topUsers.map(u => u.value);
      
      const users = await User.find({ _id: { $in: userIds } }).select("username _id");
      
      const userObjIds = userIds.map(id => new mongoose.Types.ObjectId(id));
      const scoreDocs = await Score.aggregate([
        { $match: { userId: { $in: userObjIds }, duration } },
        { $sort: { wpm: -1 } },
        { $group: { _id: "$userId", accuracy: { $first: "$accuracy" }, createdAt: { $first: "$createdAt" } } }
      ]);
      
      // 3. Map back to ordered array
      leaderboard = topUsers.map(redisUser => {
        const userDoc = users.find(u => u._id.toString() === redisUser.value);
        const scoreDoc = scoreDocs.find(s => s._id.toString() === redisUser.value);
        
        return {
          wpm: redisUser.score,
          accuracy: scoreDoc ? scoreDoc.accuracy : 100,
          createdAt: scoreDoc ? scoreDoc.createdAt : new Date().toISOString(),
          userId: {
            _id: redisUser.value,
            username: userDoc ? userDoc.username : "Unknown User"
          }
        };
      });
    }

    // 4. Fetch personal rank
    if (userIdStr) {
      const rank = await redisClient.zRank(redisKey, userIdStr, { REV: true });
      if (rank !== null) {
        const score = await redisClient.zScore(redisKey, userIdStr);
        currentUserRank = {
          rank: rank + 1, // 0-indexed
          wpm: score
        };
      }
    }
  } catch (err) {
    console.error("Redis leaderboard fetch error:", err);
    throw new ApiError(500, "Failed to fetch leaderboard");
  }

  return res.status(200).json(new ApiResponse(200, { leaderboard, currentUserRank }, "Leaderboard fetched successfully"));
});

const getUserStats = asyncHandler(async (req, res) => {
  const scores = await Score.find({ userId: req.user._id });

  if (scores.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, {
        testsCompleted: 0,
        bestWpm: 0,
        avgWpm: 0,
        avgAccuracy: 0,
      }, "User stats fetched successfully")
    );
  }

  const testsCompleted = scores.length;
  const bestWpm = Math.max(...scores.map((s) => s.wpm));
  const avgWpm = Math.round(
    scores.reduce((sum, s) => sum + s.wpm, 0) / scores.length
  );
  const avgAccuracy = (
    scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length
  ).toFixed(1);

  return res.status(200).json(
    new ApiResponse(200, { testsCompleted, bestWpm, avgWpm, avgAccuracy }, "User stats fetched successfully")
  );
});

const getPublicUserStats = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const scores = await Score.find({ userId: user._id });

  let testsCompleted = 0;
  let bestWpm = 0;
  let avgWpm = 0;
  let avgAccuracy = 0;

  if (scores.length > 0) {
    testsCompleted = scores.length;
    bestWpm = Math.max(...scores.map((s) => s.wpm));
    avgWpm = Math.round(
      scores.reduce((sum, s) => sum + s.wpm, 0) / scores.length
    );
    avgAccuracy = (
      scores.reduce((sum, s) => sum + s.accuracy, 0) / scores.length
    ).toFixed(1);
  }

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        username: user.username,
        createdAt: user.createdAt,
      },
      stats: {
        testsCompleted,
        bestWpm,
        avgWpm,
        avgAccuracy: Number(avgAccuracy),
      }
    }, "Public user stats fetched successfully")
  );
});

export { saveScore, getLeaderboard, getUserStats, getPublicUserStats };
