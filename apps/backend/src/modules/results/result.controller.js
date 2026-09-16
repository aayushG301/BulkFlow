const resultService = require("./result.service");
const resultValidation = require("./result.validation");

// Get results for a job
const getResultsByJob = async (req, res, next) => {
  try {
    const { jobId } = resultValidation.jobIdSchema.parse(req.params);

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

// Get single result
const getResult = async (req, res, next) => {
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
  getResultsByJob,
  getResult,
  updateResult,
};
