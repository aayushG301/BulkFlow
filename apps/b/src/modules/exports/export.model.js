const mongoose = require("mongoose");

const exportSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    format: {
      type: String,
      enum: ["csv"],
      default: "csv",
      required: true,
    },

    fileName: {
      type: String,
      default: null,
      trim: true,
    },

    filePath: {
      type: String,
      default: null,
      trim: true,
    },

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },

    error: {
      message: {
        type: String,
        default: null,
      },

      code: {
        type: String,
        default: null,
      },
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

exportSchema.index({ jobId: 1, userId: 1 });

const Export = mongoose.model("Export", exportSchema);

module.exports = Export;
