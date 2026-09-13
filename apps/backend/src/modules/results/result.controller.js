const resultService = require("./result.service");

const getResultById = async (req, res, next) => {
  try {
    const result = await resultService.getResultById(
      req.params.resultId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getJobResults = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    const result = await resultService.getJobResults(
      req.params.jobId,
      req.user._id,
      page,
      limit,
      status
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getFailedResults = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await resultService.getFailedResults(
      req.params.jobId,
      req.user._id,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getResultStats = async (req, res, next) => {
  try {
    const stats = await resultService.getResultStats(
      req.params.jobId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getResultById,
  getJobResults,
  getFailedResults,
  getResultStats,
};