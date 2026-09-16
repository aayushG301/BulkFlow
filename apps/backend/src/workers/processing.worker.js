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

const worker = new Worker(
  QUEUE_NAMES.PROCESSING,

  async (queueJob) => {
    const { jobId, uploadId } = queueJob.data;

    console.log(`⚙️ Starting processing: ${jobId}`);

    const processingJob = await Job.findById(jobId);

    if (!processingJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (processingJob.status === "cancelled") {
      console.log(`🛑 Job already cancelled: ${jobId}`);
      return { jobId, status: "cancelled" };
    }

    const totalRows = await Result.countDocuments({
      jobId,
      status: "pending",
    });

    if (!totalRows) {
      await completeJob(jobId, {
        totalRows: 0,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
      });

      await updateUploadStatus(uploadId, "completed");

      return {
        jobId,
        status: "completed",
        totalRows: 0,
      };
    }

    let processedRows = 0;
    let successfulRows = 0;
    let failedRows = 0;

    try {
      await updateUploadStatus(uploadId, "processing");

      const results = await Result.find({
        jobId,
        status: "pending",
      }).sort({ rowNum: 1 });

      for (const result of results) {
        // Check cancellation before each row
        const currentJob = await Job.findById(jobId).select(
          "status processingOptions",
        );

        if (!currentJob) {
          throw new Error(`Job ${jobId} not found`);
        }

        if (currentJob.status === "cancelled") {
          console.log(`🛑 Processing cancelled: ${jobId}`);

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

          if (currentJob.processingOptions?.enrichmentEnabled === true) {
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

          console.error(`❌ Row ${result.rowNum} failed:`, error.message);
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

      console.log(`✅ Processing completed: ${jobId}`);

      return {
        jobId,
        totalRows,
        processedRows,
        successfulRows,
        failedRows,
        status: completedJob.status,
      };
    } catch (error) {
      console.error(`❌ Processing failed for ${jobId}:`, error.message);

      try {
        await failJob(jobId, error);
      } catch (statusError) {
        console.error("❌ Failed to update job status:", statusError.message);
      }

      try {
        await updateUploadStatus(uploadId, "failed");
      } catch (uploadError) {
        console.error(
          "❌ Failed to update upload status:",
          uploadError.message,
        );
      }

      throw error;
    }
  },

  {
    connection: createRedisConnection(),
  },
);

worker.on("completed", (job) => {
  console.log(`✅ Processing worker completed: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`❌ Processing worker failed: ${job?.id}`, error.message);
});

worker.on("error", (error) => {
  console.error("❌ Processing worker error:", error.message);
});

module.exports = worker;
