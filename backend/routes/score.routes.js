import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  saveScore,
  getLeaderboard,
  getUserStats,
  getPublicUserStats,
} from "../controllers/score.controller.js";

const router = Router();

// Save score after test
router.route("/").post(verifyJWT, saveScore);

// Get leaderboard by duration
router.route("/").get(getLeaderboard);

// Get profile stats for logged in user
router.route("/stats").get(verifyJWT, getUserStats);

// Get public profile stats for any user by username
router.route("/user/:username").get(getPublicUserStats);

export default router;
