const Job = require("../jobs/job.model");
const Upload = require("../uploads/upload.model");

const getDashboard = async (userId) => {
  if (!userId) throw new Error("User ID is required");

  const filter = { userId };

  const [
    totalJobs,
    activeJobs,
    completedJobs,
    failedJobs,
    totalUploads,
    stats,
    recentJobs,
  ] = await Promise.all([
    Job.countDocuments(filter),

    Job.countDocuments({
      ...filter,
      status: { $in: ["queued", "processing"] },
    }),

    Job.countDocuments({
      ...filter,
      status: {
        $in: ["completed", "completed_with_errors"],
      },
    }),

    Job.countDocuments({
      ...filter,
      status: "failed",
    }),

    Upload.countDocuments(filter),

    Job.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRows: { $sum: "$processStats.totalRows" },
          processedRows: { $sum: "$processStats.processedRows" },
          successfulRows: { $sum: "$processStats.successfulRows" },
          failedRows: { $sum: "$processStats.failedRows" },
        },
      },
    ]),

    Job.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select(
        "_id name status progress processStats createdAt startedAt completedAt",
      )
      .lean(),
  ]);

  const rows = stats[0] || {
    totalRows: 0,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
  };

  return {
    summary: {
      totalJobs,
      activeJobs,
      completedJobs,
      failedJobs,
      totalUploads,
    },
    processing: {
      ...rows,
      remainingRows: Math.max(0, rows.totalRows - rows.processedRows),
    },
    recentJobs,
  };
};

module.exports = { getDashboard };
