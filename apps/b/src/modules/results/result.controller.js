const resultService = require("./result.service");
const resultValidation = require("./result.validation");

// Get all results for a job
const getJobResults = async (req, res, next) => {
  try {
    const { jobId } = resultValidation.resultJobParamsSchema.parse(req.params);

    const query = resultValidation.resultListQuerySchema.parse(req.query);

    const results = await resultService.getResultsByJob(
      jobId,
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

    const stats = await resultService.getResultStats(jobId);

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
const getResultById = async (req, res, next) => {
  try {
    const { resultId } = resultValidation.resultIdSchema.parse(req.params);

    const result = await resultService.getResultById(resultId);

    return res.status(200).json({
      success: true,
      message: "Result retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Update result
const updateResult = async (req, res, next) => {
  try {
    const { resultId } = resultValidation.resultIdSchema.parse(req.params);

    const data = resultValidation.updateResultSchema.parse(req.body);

    const result = await resultService.updateResult(resultId, data);

    return res.status(200).json({
      success: true,
      message: "Result updated successfully",
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
  updateResult,
};
