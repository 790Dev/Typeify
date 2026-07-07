import { Router } from "express";
import { analyzeCoaching } from "../controllers/coach.controller.js";

const router = Router();

// POST /api/v1/coach/analyze — AI coaching tips for a finished test
router.route("/analyze").post(analyzeCoaching);

export default router;
