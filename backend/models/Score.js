import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    duration: {
      type: Number,
      enum: [15, 30, 60, 120],
      required: false, // ✅ fixed: words mode sends null
    },

    mode: {
      type: String,
      enum: ["time", "words"],
      required: true, // ✅ added: track which mode the score was from
    },

    wpm: {
      type: Number,
      required: true,
    },

    accuracy: {
      type: Number,
      required: true,
    },

    raw: {
      type: Number,
      required: true,
    },

    consistency: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Score", scoreSchema);
