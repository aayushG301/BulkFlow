const mongoose = require("mongoose");

const uploadStatuses = [
  "queued",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
];

const uploadSchema = new mongoose.Schema(
  {
    // Owner of the upload
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Uploaded file metadata
    file: {
      originalName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 255,
      },

      storedName: {
        type: String,
        required: true,
        trim: true,
      },

      storageKey: {
        type: String,
        required: true,
        trim: true,
      },

      size: {
        type: Number,
        required: true,
        min: 0,
      },

      mimeType: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Processing configuration
    configuration: {
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

    // Processing status
    status: {
      type: String,
      enum: uploadStatuses,
      default: "queued",
      index: true,
    },

    // Row statistics
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

    // Processing timestamps
    processingStartedAt: {
      type: Date,
      default: null,
    },

    processingCompletedAt: {
      type: Date,
      default: null,
    },

    // General processing error
    error: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Useful compound index for user's upload listing
uploadSchema.index({
  userId: 1,
  createdAt: -1,
});

const Upload = mongoose.model("Upload", uploadSchema);

module.exports = Upload;