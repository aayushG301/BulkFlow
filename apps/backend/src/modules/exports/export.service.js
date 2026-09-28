const path = require("path");

const Export = require("./export.model");
const Job = require("../jobs/job.model");
const { addExportJob } = require("../../queues/export.queue");
const { fileExists } = require("../../services/file-cleanup.service");

const exportDirectory = path.resolve(process.cwd(), "exports");

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

// ----------------------------------------
// Get Export File For Download
// ----------------------------------------

const getExportFileForDownload = async ({ exportId, userId }) => {
  const exportRecord = await Export.findOne({
    _id: exportId,
    userId,
  });

  if (!exportRecord) {
    const error = new Error("Export not found");
    error.status = 404;
    throw error;
  }

  if (exportRecord.status !== "completed") {
    const error = new Error(
      `Export is not ready for download (status: ${exportRecord.status})`,
    );

    error.status = 400;
    throw error;
  }

  if (!exportRecord.filePath || !exportRecord.fileName) {
    const error = new Error("Export file is missing");
    error.status = 404;
    throw error;
  }

  // Resolve the stored path and make sure it actually lives inside the
  // exports directory, so a corrupted or tampered record can never be
  // used to read an arbitrary file off disk.
  const resolvedPath = path.resolve(exportRecord.filePath);

  if (
    resolvedPath !== exportDirectory &&
    !resolvedPath.startsWith(`${exportDirectory}${path.sep}`)
  ) {
    const error = new Error("Invalid export file path");
    error.status = 400;
    throw error;
  }

  const exists = await fileExists(resolvedPath);

  if (!exists) {
    const error = new Error("Export file no longer exists on disk");
    error.status = 404;
    throw error;
  }

  return {
    filePath: resolvedPath,
    fileName: exportRecord.fileName,
  };
};

module.exports = {
  createExport,
  getExportById,
  getExportsByJob,
  getExportFileForDownload,
};
