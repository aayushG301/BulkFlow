const { Worker } = require("bullmq");
const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Job = require("../modules/jobs/job.model");
const Result = require("../modules/results/result.model");

const { processRow } = require("../modules/processing/processing.service");
const { enrichRow } = require("../modules/enrichment/enrichment.service");

const {
  updateJobProgress,
  completeJob,
  failJob,
} = require("../modules/jobs/job.service");

const {
  updateUploadProgress,
  updateUploadStatus,
} = require("../modules/uploads/upload.service");

const processingWorker = new Worker(
  QUEUE_NAMES.PROCESSING,
  async (queueJob) => {
    const { jobId, uploadId } = queueJob.data;

    const job = await Job.findById(jobId);

    if (!job) throw new Error(`Job ${jobId} not found`);

    if (job.status === "cancelled") {
      return { jobId, status: "cancelled" };
    }

    try {
      await updateUploadStatus(uploadId, "processing");

      const totalRows = job.processStats.totalRows;

      let processedRows = job.processStats.processedRows;
      let successfulRows = job.processStats.successfulRows;
      let failedRows = job.processStats.failedRows;

      const results = await Result.find({
        jobId,
        status: "pending",
      }).sort({ rowNum: 1 });

      for (const result of results) {
        const currentJob = await Job.findById(jobId).select(
          "status processingOptions",
        );

        if (!currentJob) {
          throw new Error(`Job ${jobId} not found`);
        }

        if (currentJob.status === "cancelled") {
          return {
            jobId,
            status: "cancelled",
            processedRows,
          };
        }

        try {
          result.status = "processing";
          await result.save();

          const processed = await processRow(result);

          result.processedData = processed.processedData;

          if (currentJob.processingOptions?.enrichmentEnabled) {
            result.enrichmentData = await enrichRow(result.processedData);
          }

          result.status = "completed";
          result.processedAt = new Date();
          result.error = {
            message: null,
            code: null,
          };

          successfulRows++;
        } catch (error) {
          result.status = "failed";
          result.error = {
            message: error.message,
            code: error.code || "PROCESSING_ERROR",
          };

          failedRows++;
        }

        await result.save();

        processedRows++;

        await updateJobProgress(jobId, {
          totalRows,
          processedRows,
          successfulRows,
          failedRows,
        });

        await updateUploadProgress(uploadId, {
          totalRows,
          processedRows,
          successfulRows,
          failedRows,
        });
      }

      const completedJob = await completeJob(jobId, {
        totalRows,
        processedRows,
        successfulRows,
        failedRows,
      });

      await updateUploadStatus(
        uploadId,
        failedRows > 0 ? "completed_with_errors" : "completed",
      );

      return {
        jobId,
        status: completedJob.status,
        totalRows,
        processedRows,
        successfulRows,
        failedRows,
      };
    } catch (error) {
      await failJob(jobId, error, "PROCESSING_ERROR");

      try {
        await updateUploadStatus(uploadId, "failed");
      } catch (uploadError) {
        console.error("Upload status update failed:", uploadError.message);
      }

      throw error;
    }
  },
  {
    connection: createRedisConnection(),
  },
);

processingWorker.on("completed", (job) => {
  console.log(`✅ Processing completed: ${job.id}`);
});

processingWorker.on("failed", (job, error) => {
  console.error(`❌ Processing failed: ${job?.id}`, error.message);
});

processingWorker.on("error", (error) => {
  console.error("❌ Processing worker error:", error.message);
});

module.exports = processingWorker;
