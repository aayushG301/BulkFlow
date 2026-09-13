const Job = require("./job.model");
const {createError} = require("../../constants/error.constants");
const {getUploadForUser} = require("../uploads/upload.service");

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

  const existingJob = await Job.findOne({uploadId});
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
  const job = await Job.findOne({_id: jobId, userId});
  if (!job) {
    throw createError(404, "Job not found");
  }
  return job;
};

// Get User Jobs
const getUserJobs = async (userId, page, limit, status) => {
  page = Math.max(Number(page), 1);
  limit = Math.min(Math.max(Number(limit), 10), 100);

  const filter = {userId};
  if (status) {
    filter.status = status;
  }
  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Job.countDocuments(filter),
  ]);

  return {
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
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
  if (["processing", "completed", "completed_with_errors", "failed", "cancelled"].includes(job.status)) {
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

  if (["completed", "completed_with_errors", "failed", "cancelled"].includes(job.status)) {
    throw createError(400, `Job cannot be cancelled because it is already ${job.status}`);
  }
  job.status = "cancelled";
  await job.save();
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
  const job = await Job.findOne({
    _id: jobId,
    userId,
  });
  if (!job) {
    throw createError(404, "Job not found");
  }
  if (!["failed", "completed_with_errors"].includes(job.status)) {
    throw createError(400, `Only failed or completed-with-errors jobs can be retried, but the job is ${job.status}`);
  }

  job.status = "queued";
  job.processStats = {
    totalRows: job.processStats?.totalRows || 0,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
  };
  job.progress = 0;
  job.error = {
    message: null,
    code: null,
  };

  job.startedAt = null;
  job.completedAt = null;

  await job.save();
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
  const processedRows = Number(stats.processedRows ?? job.processStats.processedRows) || 0;
  const successfulRows = Number(stats.successfulRows ?? job.processStats.successfulRows) || 0;
  const failedRows = Number(stats.failedRows ?? job.processStats.failedRows) || 0;
  const progress = totalRows > 0 ? Math.min(Math.round((processedRows / totalRows) * 100), 100) : 0;

  job.processStats = {
    totalRows,
    processedRows,
    successfulRows,
    failedRows,
  };
  job.progress = progress;
  await job.save();
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
  const successfulRows = Number(stats.successfulRows ?? job.processStats.successfulRows) || 0;
  const failedRows = Number(stats.failedRows ?? job.processStats.failedRows) || 0;

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
  return job;
};

// Mark Job as Failed
const failJob = async (jobId, error) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw createError(404, "Job not found");
  }
  if (["completed", "completed_with_errors", "cancelled"].includes(job.status)) {
    throw createError(400, `Job cannot be marked as failed in its current state ${job.status}`);
  }
  job.status = "failed";
  job.error = {
    message: error ? error.message : "Job processing failed",
    code: error ? error.code : "JOB_PROCESSING_FAILED",
  };
  job.completedAt = new Date();

  await job.save();
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