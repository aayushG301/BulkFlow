const { failJob } = require("../modules/jobs/job.service");

const handleWorkerError = async ({ jobId, error, code = "WORKER_ERROR" }) => {
  console.error(`❌ Worker failed [${jobId}]:`, error.message);

  try {
    await failJob(jobId, {
      message: error.message,
      code: error.code || code,
    });
  } catch (statusError) {
    console.error("❌ Failed to update job status:", statusError.message);
  }

  throw error;
};

module.exports = { handleWorkerError };
