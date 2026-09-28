const Result = require("./result.model");
const Job = require("../jobs/job.model");

const { createError } = require("../../constants/error.constants");

const {
  getPagination,
  buildPaginationMeta,
} = require("../../utils/pagination");

// ----------------------------------------
// Verify Job Ownership
// ----------------------------------------
// Results are only ever reached through their parent job, so every
// read below must confirm the requesting user actually owns that job
// before any Result documents are returned.
const verifyJobOwnership = async (jobId, userId) => {
  if (!userId) {
    throw createError(401, "User authentication is required");
  }

  const job = await Job.findOne({ _id: jobId, userId }).select("_id");

  if (!job) {
    throw createError(404, "Job not found");
  }
};

// Create many results
const createManyResults = async (results) => {
  if (!Array.isArray(results) || !results.length) {
    return [];
  }

  return Result.insertMany(results);
};

// Get results for a job
const getResultsByJob = async (jobId, userId, page, pageSize, status) => {
  if (!jobId) {
    throw createError(400, "Job ID is required");
  }

  await verifyJobOwnership(jobId, userId);

  const {
    page: currentPage,
    limit: currentLimit,
    skip,
  } = getPagination({ page, limit: pageSize });

  const filter = { jobId };

  if (status) {
    filter.status = status;
  }

  const [results, total] = await Promise.all([
    Result.find(filter).sort({ rowNum: 1 }).skip(skip).limit(currentLimit),

    Result.countDocuments(filter),
  ]);

  return {
    results,
    pagination: buildPaginationMeta({
      page: currentPage,
      limit: currentLimit,
      total,
    }),
  };
};

// Get failed results for a job
const getFailedResults = async (jobId, userId, page, pageSize) => {
  if (!jobId) {
    throw createError(400, "Job ID is required");
  }

  return getResultsByJob(jobId, userId, page, pageSize, "failed");
};

// Get result statistics for a job
const getResultStats = async (jobId, userId) => {
  if (!jobId) {
    throw createError(400, "Job ID is required");
  }

  await verifyJobOwnership(jobId, userId);

  const stats = await Result.aggregate([
    {
      $match: {
        jobId,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  stats.forEach((item) => {
    result[item._id] = item.count;
    result.total += item.count;
  });

  return result;
};

// Get single result
const getResultById = async (resultId, userId) => {
  if (!resultId) {
    throw createError(400, "Result ID is required");
  }

  const result = await Result.findById(resultId);

  if (!result) {
    throw createError(404, "Result not found");
  }

  await verifyJobOwnership(result.jobId, userId);

  return result;
};

// ----------------------------------------
// Update Result (internal only)
// ----------------------------------------
// Results are mutated exclusively by the processing worker as it works
// through a job's rows. This helper is kept for that internal use only
// and is intentionally NOT exposed through the public results API -
// letting arbitrary users edit a result directly would let them
// fabricate processed/enrichment data or hide failures.
const updateResult = async (resultId, data) => {
  if (!resultId) {
    throw createError(400, "Result ID is required");
  }

  const result = await Result.findById(resultId);

  if (!result) {
    throw createError(404, "Result not found");
  }

  if (data.status !== undefined) {
    result.status = data.status;
  }

  if (data.processedData !== undefined) {
    result.processedData = data.processedData;
  }

  if (data.enrichmentData !== undefined) {
    result.enrichmentData = data.enrichmentData;
  }

  if (data.error !== undefined) {
    result.error = data.error;
  }

  if (data.status === "completed") {
    result.processedAt = new Date();
  }

  await result.save();

  return result;
};

module.exports = {
  createManyResults,
  getResultsByJob,
  getFailedResults,
  getResultStats,
  getResultById,
  updateResult,
};
