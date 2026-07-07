import { Router } from "express";
import { generateText } from "../controllers/text.controller.js";

const router = Router();

// POST /api/v1/text/generate — AI-generated typing passage
router.route("/generate").post(generateText);

export default router;
