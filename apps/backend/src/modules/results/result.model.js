const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    rowNum: {
      type: Number,
      required: true,
      min: 1,
    },

    originalData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    processedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
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

    enrichmentData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ jobId: 1, rowNum: 1 }, { unique: true });
resultSchema.index({ jobId: 1, status: 1 });

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;