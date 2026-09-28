const mongoose = require("mongoose");
const jobStatuses = require("../../constants/job.constants");

const jobSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    uploadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: jobStatuses,
      default: jobStatuses.QUEUED,
      index: true,
    },
    processStats: {
      totalRows: {
        type: Number,
        default: 0,
        min: 0,
      },

      processedRows: {
        type: Number,
        default: 0,
        min: 0,
      },

      successfulRows: {
        type: Number,
        default: 0,
        min: 0,
      },

      failedRows: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    processingOptions: {
      enrichmentEnabled: {
        type: Boolean,
        default: false,
      },
      enrichmentProvider: {
        type: String,
        trim: true,
        default: null,
      },
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
    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ status: 1, createdAt: -1 });

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;