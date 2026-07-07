import { generateCoaching } from "../utils/ai.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

const analyzeCoaching = asyncHandler(async (req, res) => {
  try {
    const tips = await generateCoaching(req.body || {});
    return res.status(200).json(new ApiResponse(200, { tips }, "Coaching tips generated successfully"));
  } catch (err) {
    console.error("AI coaching failed:", err.message);
    throw new ApiError(503, "AI coaching unavailable");
  }
});

export { analyzeCoaching };
