const mongoose = require("mongoose");
const Result = require("./result.model");
const Job = require("../jobs/job.model");

const getJobForUser = async (jobId, userId) => {
  const job = await Job.findOne({
    _id: jobId,
    userId,
  });

  if (!job) {
    const error = new Error("Job not found");
    error.status = 404;
    throw error;
  }

  return job;
};

// Get a single result
const getResultById = async (resultId, userId) => {
  if (!mongoose.isValidObjectId(resultId)) {
    const error = new Error("Invalid result ID");
    error.status = 400;
    throw error;
  }

  const result = await Result.findById(resultId).populate({
    path: "jobId",
    select: "userId name status",
  });

  if (!result || !result.jobId) {
    const error = new Error("Result not found");
    error.status = 404;
    throw error;
  }

  if (result.jobId.userId.toString() !== userId.toString()) {
    const error = new Error("Result not found");
    error.status = 404;
    throw error;
  }

  return result;
};

// Get all results for a job
const getJobResults = async (
  jobId,
  userId,
  page = 1,
  limit = 10,
  status
) => {
  await getJobForUser(jobId, userId);

  const filter = {
    jobId,
  };

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    Result.find(filter)
      .sort({ rowNum: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Result.countDocuments(filter),
  ]);

  return {
    results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get only failed results for a job
const getFailedResults = async (
  jobId,
  userId,
  page = 1,
  limit = 10
) => {
  await getJobForUser(jobId, userId);

  const filter = {
    jobId,
    status: "failed",
  };

  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    Result.find(filter)
      .sort({ rowNum: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Result.countDocuments(filter),
  ]);

  return {
    results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get result statistics for a job
const getResultStats = async (jobId, userId) => {
  await getJobForUser(jobId, userId);

  const stats = await Result.aggregate([
    {
      $match: {
        jobId: new mongoose.Types.ObjectId(jobId),
      },
    },
    {
      $group: {
        _id: "$status",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const resultStats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  for (const stat of stats) {
    resultStats[stat._id] = stat.count;
    resultStats.total += stat.count;
  }

  return resultStats;
};

// Internal: create one result
const createResult = async (data) => {
  return Result.create(data);
};

// Internal: bulk create results
const createManyResults = async (results) => {
  if (!results || results.length === 0) {
    return [];
  }

  return Result.insertMany(results, {
    ordered: false,
  });
};

// Internal: update a result
const updateResult = async (resultId, data) => {
  if (!mongoose.isValidObjectId(resultId)) {
    const error = new Error("Invalid result ID");
    error.status = 400;
    throw error;
  }

  const result = await Result.findByIdAndUpdate(
    resultId,
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!result) {
    const error = new Error("Result not found");
    error.status = 404;
    throw error;
  }

  return result;
};

module.exports = {
  getResultById,
  getJobResults,
  getFailedResults,
  getResultStats,
  createResult,
  createManyResults,
  updateResult,
};