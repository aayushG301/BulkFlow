const Result = require("./result.model");
const { createError } = require("../../constants/error.constants");
const {
  getPagination,
  buildPaginationMeta,
} = require("../../utils/pagination");

// Create many results
const createManyResults = async (results) => {
  if (!Array.isArray(results) || !results.length) return [];

  return Result.insertMany(results);
};

// Get results for a job
const getResultsByJob = async (jobId, page, limit, status) => {
  if (!jobId) {
    throw createError(400, "Job ID is required");
  }

  const {
    page: currentPage,
    limit: currentLimit,
    skip,
  } = getPagination(page, limit);

  const filter = { jobId };

  if (status) filter.status = status;

  const [results, total] = await Promise.all([
    Result.find(filter).sort({ rowNum: 1 }).skip(skip).limit(currentLimit),
    Result.countDocuments(filter),
  ]);

  return {
    results,
    pagination: buildPaginationMeta(currentPage, currentLimit, total),
  };
};

// Get single result
const getResultById = async (resultId, jobId) => {
  if (!resultId) {
    throw createError(400, "Result ID is required");
  }

  const filter = { _id: resultId };

  if (jobId) filter.jobId = jobId;

  const result = await Result.findOne(filter);

  if (!result) {
    throw createError(404, "Result not found");
  }

  return result;
};

// Update result
const updateResult = async (resultId, data) => {
  const result = await Result.findById(resultId);

  if (!result) {
    throw createError(404, "Result not found");
  }

  if (data.status !== undefined) result.status = data.status;
  if (data.processedData !== undefined) {
    result.processedData = data.processedData;
  }
  if (data.enrichmentData !== undefined) {
    result.enrichmentData = data.enrichmentData;
  }
  if (data.error !== undefined) result.error = data.error;

  if (data.status === "completed") {
    result.processedAt = new Date();
  }

  await result.save();

  return result;
};

module.exports = {
  createManyResults,
  getResultsByJob,
  getResultById,
  updateResult,
};
