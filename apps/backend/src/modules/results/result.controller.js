const resultService = require("./result.service");
const resultValidation = require("./result.validation");

// Get all results for a job
const getJobResults = async (req, res, next) => {
  try {
    const { jobId } = resultValidation.resultJobParamsSchema.parse(req.params);

    const query = resultValidation.resultListQuerySchema.parse(req.query);

    const results = await resultService.getResultsByJob(
      jobId,
      req.user.id,
      query.page,
      query.pageSize,
      query.status,
    );

    return res.status(200).json({
      success: true,
      message: "Results retrieved successfully",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Get failed results for a job
const getFailedResults = async (req, res, next) => {
  try {
    const { jobId } = resultValidation.resultJobParamsSchema.parse(req.params);

    const query = resultValidation.resultListQuerySchema.parse(req.query);

    const results = await resultService.getFailedResults(
      jobId,
      req.user.id,
      query.page,
      query.pageSize,
    );

    return res.status(200).json({
      success: true,
      message: "Failed results retrieved successfully",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Get result statistics for a job
const getResultStats = async (req, res, next) => {
  try {
    const { jobId } = resultValidation.resultJobParamsSchema.parse(req.params);

    const stats = await resultService.getResultStats(jobId, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Result statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single result
// NOTE: results are not publicly mutable - see result.service.js for why
// updateResult is kept internal-only and is not wired up to a route here.
const getResultById = async (req, res, next) => {
  try {
    const { resultId } = resultValidation.resultIdSchema.parse(req.params);

    const result = await resultService.getResultById(resultId, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Result retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobResults,
  getFailedResults,
  getResultStats,
  getResultById,
};
