import { Router } from "express";
import { checkHealth } from "../controllers/healthCheck.controller.js";

const router = Router();

router.route("/").get(checkHealth);

export default router;
