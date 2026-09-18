const Job = require("./job.model");
const { createError } = require("../../constants/error.constants");
const { getUploadForUser } = require("../uploads/upload.service");
const {
  getPagination,
  buildPaginationMeta,
} = require("../../utils/pagination");
const Result = require("../results/result.model");
const { addProcessingJob } = require("../../queues/processing.queue");
const {
  emitJobProgress,
  emitJobStatus,
  emitJobCompleted,
  emitJobFailed,
} = require("../../services/job-events.service");

// Create Job
const createJob = async (userId, jobData) => {
  const { name, uploadId, processingOptions } = jobData;
  if (!uploadId) {
    throw createError(400, "Upload ID is required");
  }
  // Check if upload exists
  const upload = await getUploadForUser(uploadId, userId);
  if (!upload) {
    throw createError(404, "Upload not found");
  }

  const existingJob = await Job.findOne({ uploadId });
  if (existingJob) {
    throw createError(409, "A job already exists for this upload");
  }

  const job = await Job.create({
    name,
    userId,
    uploadId,
    status: "queued",
    processingOptions: processingOptions || {},
  });
  return job;
};

// Get Job By ID
const getJobById = async (jobId, userId) => {
  const job = await Job.findOne({ _id: jobId, userId });
  if (!job) {
    throw createError(404, "Job not found");
  }
  return job;
};

// Get User Jobs
const getUserJobs = async (userId, page, limit, status) => {
  const pagination = getPagination(page, limit);
  const filter = { userId };

  if (status) filter.status = status;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Job.countDocuments(filter),
  ]);

  return {
    jobs,
    pagination: buildPaginationMeta(pagination.page, pagination.limit, total),
  };
};

// Update Job
const updateJob = async (jobId, userId, jobData) => {
  const job = await Job.findOne({
    _id: jobId,
    userId,
  });

  if (!job) {
    throw createError(404, "Job not found");
  }
  if (
    [
      "processing",
      "completed",
      "completed_with_errors",
      "failed",
      "cancelled",
    ].includes(job.status)
  ) {
    throw createError(400, `Job cannot be updated in its current state`);
  }
  if (jobData.name !== undefined) {
    job.name = jobData.name;
  }
  if (jobData.processingOptions !== undefined) {
    job.processingOptions = {
      ...job.processingOptions.toObject?.(),
      ...jobData.processingOptions,
    };
  }
  await job.save();
  return job;
};

// Cancel Job
const cancelJob = async (jobId, userId) => {
  const job = await Job.findOne({
    _id: jobId,
    userId,
  });

  if (!job) {
    throw createError(404, "Job not found");
  }

  if (
    ["completed", "completed_with_errors", "failed", "cancelled"].includes(
      job.status,
    )
  ) {
    throw createError(
      400,
      `Job cannot be cancelled because it is already ${job.status}`,
    );
  }
  job.status = "cancelled";
  await job.save();

  emitJobStatus(jobId, "cancelled", {
    completedAt: job.completedAt,
  });

  return job;
};

// Delete Job
const deleteJob = async (jobId, userId) => {
  const job = await Job.findOne({
    _id: jobId,
    userId,
  });
  if (!job) {
    throw createError(404, "Job not found");
  }
  if (job.status === "processing") {
    throw createError(400, "Processing job cannot be deleted");
  }

  await Job.deleteOne({
    _id: jobId,
    userId,
  });

  return true;
};

// Retry Job
const retryJob = async (jobId, userId) => {
  const job = await Job.findOne({ _id: jobId, userId });

  if (!job) throw createError(404, "Job not found");

  if (!["failed", "completed_with_errors"].includes(job.status)) {
    throw createError(400, "Job cannot be retried in its current state");
  }

  await Result.updateMany(
    { jobId, status: "failed" },
    {
      $set: {
        status: "pending",
        processedData: null,
        enrichmentData: null,
        processedAt: null,
        error: { message: null, code: null },
      },
    },
  );

  const failedCount = await Result.countDocuments({
    jobId,
    status: "pending",
  });

  job.status = "queued";
  job.progress = 0;
  job.processStats = {
    totalRows: failedCount,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
  };
  job.error = { message: null, code: null };
  job.startedAt = null;
  job.completedAt = null;

  await job.save();

  await addProcessingJob({
    jobId: job._id.toString(),
    uploadId: job.uploadId.toString(),
  });

  return job;
};

// Mark Job as Processing
const markJobProcessing = async (jobId) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw createError(404, "Job not found");
  }
  if (job.status !== "queued") {
    throw createError(400, "Only queued jobs can start processing");
  }

  job.status = "processing";
  job.startedAt = new Date();

  await job.save();
  emitJobStatus(jobId, "processing", {
    startedAt: job.startedAt,
  });
  return job;
};

// Update Job Progress
const updateJobProgress = async (jobId, stats = {}) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw createError(404, "Job not found");
  }
  if (job.status !== "processing") {
    throw createError(400, "Job is not currently processing");
  }

  const totalRows = Number(stats.totalRows ?? job.processStats.totalRows) || 0;
  const processedRows =
    Number(stats.processedRows ?? job.processStats.processedRows) || 0;
  const successfulRows =
    Number(stats.successfulRows ?? job.processStats.successfulRows) || 0;
  const failedRows =
    Number(stats.failedRows ?? job.processStats.failedRows) || 0;
  const progress =
    totalRows > 0
      ? Math.min(Math.round((processedRows / totalRows) * 100), 100)
      : 0;

  job.processStats = {
    totalRows,
    processedRows,
    successfulRows,
    failedRows,
  };
  job.progress = progress;
  await job.save();

  emitJobProgress(jobId, {
    progress: job.progress,
    processStats: job.processStats,
  });

  return job;
};

// Mark Job as Completed
const completeJob = async (jobId, stats = {}) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw createError(404, "Job not found");
  }
  if (job.status !== "processing") {
    throw createError(400, "Only processing jobs can be completed");
  }
  const totalRows = Number(stats.totalRows ?? job.processStats.totalRows) || 0;
  const processedRows = Number(stats.processedRows ?? totalRows) || 0;
  const successfulRows =
    Number(stats.successfulRows ?? job.processStats.successfulRows) || 0;
  const failedRows =
    Number(stats.failedRows ?? job.processStats.failedRows) || 0;

  job.processStats = {
    totalRows,
    processedRows,
    successfulRows,
    failedRows,
  };
  job.progress = 100;
  job.status = failedRows > 0 ? "completed_with_errors" : "completed";
  job.completedAt = new Date();

  await job.save();

  emitJobCompleted(jobId, {
    status: job.status,
    progress: 100,
    processStats: job.processStats,
    completedAt: job.completedAt,
  });

  return job;
};

// Mark Job as Failed
const failJob = async (jobId, error) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw createError(404, "Job not found");
  }
  if (
    ["completed", "completed_with_errors", "cancelled"].includes(job.status)
  ) {
    throw createError(
      400,
      `Job cannot be marked as failed in its current state ${job.status}`,
    );
  }
  job.status = "failed";
  job.error = {
    message: error ? error.message : "Job processing failed",
    code: error ? error.code : "JOB_PROCESSING_FAILED",
  };
  job.completedAt = new Date();

  await job.save();

  emitJobFailed(jobId, error);

  return job;
};

module.exports = {
  createJob,
  getJobById,
  getUserJobs,
  updateJob,
  cancelJob,
  deleteJob,
  retryJob,
  markJobProcessing,
  updateJobProgress,
  completeJob,
  failJob,
};
