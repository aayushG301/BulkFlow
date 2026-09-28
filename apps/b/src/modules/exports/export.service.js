const Export = require("./export.model");
const Job = require("../jobs/job.model");
const { addExportJob } = require("../../queues/export.queue");

// ----------------------------------------
// Create Export
// ----------------------------------------

const createExport = async ({ jobId, userId, format = "csv" }) => {
  const job = await Job.findOne({
    _id: jobId,
    userId,
  });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  if (job.status !== "completed" && job.status !== "completed_with_errors") {
    const error = new Error(
      "Results can only be exported after processing is completed",
    );

    error.status = 400;
    throw error;
  }

  if (format !== "csv") {
    const error = new Error("Only CSV export is currently supported");
    error.status = 400;
    throw error;
  }

  const exportRecord = await Export.create({
    jobId,
    userId,
    format,
    status: "queued",
  });

  await addExportJob({
    exportId: exportRecord._id.toString(),
    jobId: jobId.toString(),
    userId: userId.toString(),
    format,
  });

  return exportRecord;
};

// ----------------------------------------
// Get Export
// ----------------------------------------

const getExportById = async ({ exportId, userId }) => {
  const exportRecord = await Export.findOne({
    _id: exportId,
    userId,
  });

  if (!exportRecord) {
    const error = new Error("Export not found");
    error.status = 404;
    throw error;
  }

  return exportRecord;
};

// ----------------------------------------
// Get Exports For Job
// ----------------------------------------

const getExportsByJob = async ({ jobId, userId }) => {
  return Export.find({
    jobId,
    userId,
  }).sort({ createdAt: -1 });
};

module.exports = {
  createExport,
  getExportById,
  getExportsByJob,
};
