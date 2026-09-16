const Job = require("../modules/jobs/job.model");

// ----------------------------------------
// Mark Processing
// ----------------------------------------

const markJobProcessing = async (jobId) => {
  const job = await Job.findByIdAndUpdate(
    jobId,
    {
      status: "processing",
      startedAt: new Date(),
      error: {
        message: null,
        code: null,
      },
    },
    {
      new: true,
    },
  );

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  return job;
};

// ----------------------------------------
// Update Progress
// ----------------------------------------

const updateJobProgress = async (
  jobId,
  { processedRows, successfulRows, failedRows, progress },
) => {
  const job = await Job.findByIdAndUpdate(
    jobId,
    {
      "processStats.processedRows": processedRows,
      "processStats.successfulRows": successfulRows,
      "processStats.failedRows": failedRows,
      progress,
    },
    {
      new: true,
    },
  );

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  return job;
};

// ----------------------------------------
// Complete Job
// ----------------------------------------

const completeJob = async (
  jobId,
  { successfulRows = 0, failedRows = 0, processedRows = 0 } = {},
) => {
  const status = failedRows > 0 ? "completed_with_errors" : "completed";

  const job = await Job.findByIdAndUpdate(
    jobId,
    {
      status,
      progress: 100,
      "processStats.processedRows": processedRows,
      "processStats.successfulRows": successfulRows,
      "processStats.failedRows": failedRows,
      completedAt: new Date(),
    },
    {
      new: true,
    },
  );

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  return job;
};

// ----------------------------------------
// Fail Job
// ----------------------------------------

const failJob = async (jobId, error, code = "JOB_PROCESSING_ERROR") => {
  const job = await Job.findByIdAndUpdate(
    jobId,
    {
      status: "failed",
      error: {
        message: error?.message || "Job failed",
        code: error?.code || code,
      },
      completedAt: new Date(),
    },
    {
      new: true,
    },
  );

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  return job;
};

module.exports = {
  markJobProcessing,
  updateJobProgress,
  completeJob,
  failJob,
};
