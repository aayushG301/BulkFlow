const Job = require("./job.model");
const { createError } = require("../../constants/error.constants");
const {
  getUploadForUser,
  updateUploadStatus,
} = require("../uploads/upload.service");
const {
  getPagination,
  buildPaginationMeta,
} = require("../../utils/pagination");
const Result = require("../results/result.model");
const { ingestionQueue, addIngestionJob } = require("../../queues/ingestion.queue");
const { processingQueue, addProcessingJob } = require("../../queues/processing.queue");
const {
  emitJobProgress,
  emitJobStatus,
  emitJobCompleted,
  emitJobFailed,
} = require("../../services/job-events.service");

// ----------------------------------------
// Remove Queued Background Jobs
// ----------------------------------------
// Best-effort cleanup so a cancelled/deleted job's queued or delayed
// BullMQ entries never get picked up by a worker after the fact.
const removeQueuedJobs = async (jobId) => {
  const queues = [ingestionQueue, processingQueue];

  for (const queue of queues) {
    try {
      const queuedJobs = await queue.getJobs(["waiting", "delayed"]);

      const jobsToRemove = queuedJobs.filter(
        (queuedJob) => queuedJob.data?.jobId === jobId.toString(),
      );

      await Promise.all(jobsToRemove.map((queuedJob) => queuedJob.remove()));
    } catch (error) {
      console.error(
        `⚠️ Failed to remove queued jobs for job ${jobId}:`,
        error.message,
      );
    }
  }
};

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

  // Kick off the background ingestion pipeline for this job
  await addIngestionJob({
    uploadId: job.uploadId.toString(),
    jobId: job._id.toString(),
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
  const pagination = getPagination({ page, limit });
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
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      total,
    }),
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
  // Atomically flip the status so two concurrent cancel requests (or a
  // cancel racing a worker) can never both succeed.
  const job = await Job.findOneAndUpdate(
    {
      _id: jobId,
      userId,
      status: { $in: ["queued", "processing"] },
    },
    {
      $set: {
        status: "cancelled",
        completedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!job) {
    const existingJob = await Job.findOne({ _id: jobId, userId });

    if (!existingJob) {
      throw createError(404, "Job not found");
    }

    throw createError(
      400,
      `Job cannot be cancelled because it is already ${existingJob.status}`,
    );
  }

  // Make sure a worker never picks up queued/delayed work for a job
  // that has already been cancelled.
  await removeQueuedJobs(jobId);

  try {
    await updateUploadStatus(job.uploadId, "cancelled", userId);
  } catch (error) {
    // The upload may already be in a terminal state - that should not
    // block cancellation of the job itself.
    console.error(
      `⚠️ Failed to sync upload status after cancelling job ${jobId}:`,
      error.message,
    );
  }

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

  // Prevent an orphaned queue entry from referencing a job that
  // no longer exists.
  await removeQueuedJobs(jobId);

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

  // Atomically move the job out of a retryable state first. If two
  // retry requests arrive concurrently, only one of them will find a
  // matching document here - the other gets a conflict instead of
  // queuing a duplicate processing/ingestion run.
  const lockedJob = await Job.findOneAndUpdate(
    {
      _id: jobId,
      userId,
      status: { $in: ["failed", "completed_with_errors"] },
    },
    {
      $set: {
        status: "queued",
        error: { message: null, code: null },
        startedAt: null,
        completedAt: null,
      },
    },
    { new: true },
  );

  if (!lockedJob) {
    throw createError(
      409,
      "Job retry is already in progress or the job is no longer retryable",
    );
  }

  const totalRows = await Result.countDocuments({ jobId });

  // No result rows exist yet, which means ingestion itself never
  // completed for this job - re-run ingestion instead of processing.
  if (totalRows === 0) {
    lockedJob.processStats = {
      totalRows: 0,
      processedRows: 0,
      successfulRows: 0,
      failedRows: 0,
    };
    lockedJob.progress = 0;

    await lockedJob.save();

    try {
      await updateUploadStatus(lockedJob.uploadId, "queued", userId);
    } catch (error) {
      console.error(
        `⚠️ Failed to sync upload status while retrying job ${jobId}:`,
        error.message,
      );
    }

    emitJobStatus(jobId, "queued", {
      progress: lockedJob.progress,
      processStats: lockedJob.processStats,
    });

    await addIngestionJob({
      jobId: lockedJob._id.toString(),
      uploadId: lockedJob.uploadId.toString(),
    });

    return lockedJob;
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

  const successfulRows = await Result.countDocuments({
    jobId,
    status: "completed",
  });

  const failedRows = await Result.countDocuments({
    jobId,
    status: "failed",
  });

  const processedRows = successfulRows + failedRows;

  lockedJob.progress =
    totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

  lockedJob.processStats = {
    totalRows,
    processedRows,
    successfulRows,
    failedRows,
  };

  await lockedJob.save();

  try {
    await updateUploadStatus(lockedJob.uploadId, "queued", userId);
  } catch (error) {
    console.error(
      `⚠️ Failed to sync upload status while retrying job ${jobId}:`,
      error.message,
    );
  }

  emitJobStatus(jobId, "queued", {
    progress: lockedJob.progress,
    processStats: lockedJob.processStats,
  });

  await addProcessingJob({
    jobId: lockedJob._id.toString(),
    uploadId: lockedJob.uploadId.toString(),
  });

  return lockedJob;
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
    progress: job.progress,
    processStats: job.processStats,
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
    remainingRows: Math.max(0, totalRows - processedRows),
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
    remainingRows: 0,
    completedAt: job.completedAt,
  });

  return job;
};

// Mark Job as Failed
const failJob = async (jobId, error, code) => {
  const job = await Job.findById(jobId);

  if (!job) {
    throw createError(404, "Job not found");
  }

  if (
    ["completed", "completed_with_errors", "cancelled"].includes(job.status)
  ) {
    throw createError(
      400,
      `Job cannot be marked as failed in its current state: ${job.status}`,
    );
  }

  const errorMessage = error?.message || "Job processing failed";

  const errorCode = code || error?.code || "JOB_PROCESSING_FAILED";

  job.status = "failed";

  job.error = {
    message: errorMessage,
    code: errorCode,
  };

  job.completedAt = new Date();

  await job.save();

  emitJobFailed(jobId, {
    message: errorMessage,
    code: errorCode,
  });

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
