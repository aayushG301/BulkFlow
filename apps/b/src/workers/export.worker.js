const { Worker } = require("bullmq");
const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Export = require("../modules/exports/export.model");
const Result = require("../modules/results/result.model");
const { createCSVFile } = require("../services/export-file.service");

const exportWorker = new Worker(
  QUEUE_NAMES.EXPORT,
  async (queueJob) => {
    const { exportId, jobId } = queueJob.data;

    const exportRecord = await Export.findById(exportId);

    if (!exportRecord) {
      throw new Error(`Export ${exportId} not found`);
    }

    exportRecord.status = "processing";
    await exportRecord.save();

    try {
      const results = await Result.find({
        jobId,
        status: {
          $in: ["completed", "failed"],
        },
      }).sort({ rowNum: 1 });

      if (!results.length) {
        const error = new Error("No results available for export");
        error.code = "NO_RESULTS";
        throw error;
      }

      const file = await createCSVFile(results, jobId);

      exportRecord.status = "completed";
      exportRecord.fileName = file.fileName;
      exportRecord.filePath = file.filePath;
      exportRecord.completedAt = new Date();
      exportRecord.error = {
        message: null,
        code: null,
      };

      await exportRecord.save();

      return {
        exportId,
        jobId,
        fileName: file.fileName,
      };
    } catch (error) {
      exportRecord.status = "failed";
      exportRecord.error = {
        message: error.message,
        code: error.code || "EXPORT_ERROR",
      };

      await exportRecord.save();

      throw error;
    }
  },
  {
    connection: createRedisConnection(),
  },
);

exportWorker.on("completed", (job) => {
  console.log(`✅ Export completed: ${job.id}`);
});

exportWorker.on("failed", (job, error) => {
  console.error(`❌ Export failed: ${job?.id}`, error.message);
});

exportWorker.on("error", (error) => {
  console.error("❌ Export worker error:", error.message);
});

module.exports = exportWorker;
