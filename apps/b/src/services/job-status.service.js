const jobService = require("../modules/jobs/job.service");

module.exports = {
  markJobProcessing: jobService.markJobProcessing,
  updateJobProgress: jobService.updateJobProgress,
  completeJob: jobService.completeJob,
  failJob: jobService.failJob,
};
