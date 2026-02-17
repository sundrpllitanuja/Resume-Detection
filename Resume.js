const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true
    },
    resumeText: {
      type: String,
      required: true
    },
    fraudScore: {
      type: Number,
      default: 0
    },
    flags: {
      type: [String],
      default: []
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
