const fs = require("fs/promises");
const path = require("path");
const Upload = require("./upload.model");
const { createError } = require("../../constants/error.constants");
const {
  getPagination,
  buildPaginationMeta,
} = require("../../utils/pagination");
const Job = require("../jobs/job.model");

// Helpers
const getUploadForUser = async (uploadId, userId) => {
  const upload = await Upload.findOne({
    _id: uploadId,
    userId,
  });

  if (!upload) {
    throw createError(404, "Upload not found");
  }
  return upload;
};

// Create Upload
const createUpload = async (userId, file, configuration = {}) => {
  if (!userId) {
    throw createError(401, "User authentication is required");
  }
  if (!file) {
    throw createError(400, "Upload file is required");
  }
  const upload = await Upload.create({
    userId,
    file: {
      originalName: file.originalname,
      storedName: file.filename,
      storageKey: file.path,
      size: file.size,
      mimeType: file.mimetype,
    },

    configuration: {
      enrichmentEnabled: configuration.enrichmentEnabled ?? false,
      enrichmentProvider: configuration.enrichmentProvider ?? null,
    },
    status: "queued",
    totalRows: 0,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
  });
  return upload;
};

// Get Upload By ID
const getUploadById = async (uploadId, userId) => {
  if (!uploadId) {
    throw createError(400, "Upload ID is required");
  }
  return getUploadForUser(uploadId, userId);
};

// Get User Uploads
const getUserUploads = async (userId, page, limit, status) => {
  if (!userId) {
    throw createError(401, "User authentication is required");
  }

  const pagination = getPagination(page, limit);
  const filter = { userId };

  if (status) filter.status = status;

  const [uploads, total] = await Promise.all([
    Upload.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Upload.countDocuments(filter),
  ]);

  return {
    uploads,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, total),
  };
};

// Update Upload Status
const updateUploadStatus = async (uploadId, status, userId = null) => {
  const validStatuses = [
    "queued",
    "processing",
    "completed",
    "completed_with_errors",
    "failed",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    throw createError(400, "Invalid upload status");
  }

  const filter = {
    _id: uploadId,
  };

  if (userId) {
    filter.userId = userId;
  }

  const upload = await Upload.findOne(filter);

  if (!upload) {
    throw createError(404, "Upload not found");
  }

  const currentStatus = upload.status;

  // Prevent updating a completed/cancelled upload
  if (
    ["completed", "cancelled"].includes(currentStatus) &&
    currentStatus !== status
  ) {
    throw createError(400, `Cannot change status from ${currentStatus}`);
  }

  upload.status = status;

  if (status === "processing" && !upload.processingStartedAt) {
    upload.processingStartedAt = new Date();
  }

  if (
    ["completed", "completed_with_errors", "failed", "cancelled"].includes(
      status,
    )
  ) {
    upload.processingCompletedAt = new Date();
  }

  await upload.save();

  return upload;
};

// Update Upload Progress
const updateUploadProgress = async (uploadId, progressData) => {
  const upload = await Upload.findById(uploadId);

  if (!upload) {
    throw createError(404, "Upload not found");
  }

  const { totalRows, processedRows, successfulRows, failedRows } = progressData;

  if (totalRows !== undefined) {
    upload.totalRows = Math.max(Number(totalRows), 0);
  }

  if (processedRows !== undefined) {
    upload.processedRows = Math.max(Number(processedRows), 0);
  }

  if (successfulRows !== undefined) {
    upload.successfulRows = Math.max(Number(successfulRows), 0);
  }

  if (failedRows !== undefined) {
    upload.failedRows = Math.max(Number(failedRows), 0);
  }

  await upload.save();

  return upload;
};

// Cancel Upload
const cancelUpload = async (uploadId, userId) => {
  const upload = await getUploadForUser(uploadId, userId);

  if (["completed", "completed_with_errors"].includes(upload.status)) {
    throw createError(400, "Completed uploads cannot be cancelled");
  }

  if (upload.status === "cancelled") {
    throw createError(400, "Upload is already cancelled");
  }

  upload.status = "cancelled";
  upload.processingCompletedAt = new Date();

  await upload.save();

  await Job.updateMany(
    { uploadId: upload._id, userId, status: { $in: ["queued", "processing"] } },
    {
      status: "cancelled",
      completedAt: new Date(),
    },
  );

  return upload;
};

// Delete Upload
const deleteUpload = async (uploadId, userId) => {
  const upload = await getUploadForUser(uploadId, userId);

  // Remove stored file if it exists
  if (upload.file?.storageKey) {
    try {
      await fs.unlink(path.resolve(upload.file.storageKey));
    } catch (error) {
      // Ignore missing file.
      // Other filesystem errors should not silently
      // break database deletion.
      if (error.code !== "ENOENT") {
        throw createError(500, "Failed to delete uploaded file");
      }
    }
  }

  await Upload.deleteOne({
    _id: upload._id,
    userId,
  });

  return upload;
};

// Retry Upload
const retryUpload = async (uploadId, userId) => {
  const upload = await getUploadForUser(uploadId, userId);

  if (!["failed", "completed_with_errors"].includes(upload.status)) {
    throw createError(
      400,
      "Only failed or completed-with-errors uploads can be retried",
    );
  }

  upload.status = "queued";

  upload.processedRows = 0;
  upload.successfulRows = 0;
  upload.failedRows = 0;

  upload.processingStartedAt = null;
  upload.processingCompletedAt = null;
  upload.error = null;

  await upload.save();

  return upload;
};

module.exports = {
  createUpload,
  getUploadForUser,
  getUploadById,
  getUserUploads,
  updateUploadStatus,
  updateUploadProgress,
  cancelUpload,
  deleteUpload,
  retryUpload,
};
