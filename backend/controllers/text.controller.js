import { generateTypingText } from "../utils/ai.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

const generateText = asyncHandler(async (req, res) => {
  try {
    const text = await generateTypingText(req.body || {});
    return res.status(200).json(new ApiResponse(200, { text }, "Text generated successfully"));
  } catch (err) {
    console.error("AI text generation failed:", err.message);
    throw new ApiError(503, "AI text generation unavailable");
  }
});

export { generateText };
