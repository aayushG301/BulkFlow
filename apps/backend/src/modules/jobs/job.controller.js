const jobService = require("./job.service");
const jobValidation = require("./job.validation");

const createJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validatedData = jobValidation.createJobSchema.parse(req.body);
    const job = await jobService.createJob(userId, validatedData);
    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const getJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = jobValidation.jobIdSchema.parse(req.params).jobId;
    const job = await jobService.getJobById(jobId, userId);
    return res.status(200).json({
      success: true,
      message: "Job retrieved successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = jobValidation.jobListQuerySchema.parse(req.query);

    const jobs = await jobService.getUserJobs(
      userId,
      query.page,
      query.pageSize,
      query.status,
    );

    return res.status(200).json({
      success: true,
      message: "Jobs retrieved successfully",
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = jobValidation.jobIdSchema.parse(req.params).jobId;
    const jobData = jobValidation.updateJobSchema.parse(req.body);
    const job = await jobService.updateJob(jobId, userId, jobData);
    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const cancelJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = jobValidation.jobIdSchema.parse(req.params).jobId;
    const job = await jobService.cancelJob(jobId, userId);
    return res.status(200).json({
      success: true,
      message: "Job canceled successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = jobValidation.jobIdSchema.parse(req.params).jobId;
    const job = await jobService.deleteJob(jobId, userId);
    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

const retryJob = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const jobId = jobValidation.jobIdSchema.parse(req.params).jobId;
    const job = await jobService.retryJob(jobId, userId);
    return res.status(200).json({
      success: true,
      message: "Job retried successfully",
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJob,
  getJobs,
  updateJob,
  cancelJob,
  deleteJob,
  retryJob,
};
