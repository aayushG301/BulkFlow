const Job = require("../jobs/job.model");
const Upload = require("../uploads/upload.model");

const getDashboard = async (userId) => {
  if (!userId) {
    const error = new Error("User ID is required");

    error.status = 400;

    throw error;
  }

  const [
    totalJobs,
    activeJobs,
    completedJobs,
    failedJobs,
    totalUploads,
    recentJobs,
  ] = await Promise.all([
    Job.countDocuments({
      userId,
    }),

    Job.countDocuments({
      userId,
      status: {
        $in: ["queued", "processing"],
      },
    }),

    Job.countDocuments({
      userId,
      status: {
        $in: ["completed", "completed_with_errors"],
      },
    }),

    Job.countDocuments({
      userId,
      status: "failed",
    }),

    Upload.countDocuments({
      userId,
    }),

    Job.find({
      userId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(5)
      .select(
        "_id name status progress processStats createdAt startedAt completedAt",
      )
      .lean(),
  ]);

  let totalRows = 0;
  let processedRows = 0;
  let successfulRows = 0;
  let failedRows = 0;

  for (const job of recentJobs) {
    totalRows += job.processStats?.totalRows || 0;

    processedRows += job.processStats?.processedRows || 0;

    successfulRows += job.processStats?.successfulRows || 0;

    failedRows += job.processStats?.failedRows || 0;
  }

  return {
    summary: {
      totalJobs,
      activeJobs,
      completedJobs,
      failedJobs,
      totalUploads,
    },

    processing: {
      totalRows,
      processedRows,
      remainingRows: Math.max(0, totalRows - processedRows),
      successfulRows,
      failedRows,
    },

    recentJobs,
  };
};

module.exports = {
  getDashboard,
};
