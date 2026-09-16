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

  async (job) => {
    const { jobId, uploadId } = job.data;

    console.log(`⚙️ Starting processing: ${jobId}`);

    const processingJob = await Job.findById(jobId);

    if (!processingJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    /*
     * Ingestion worker already changes the job
     * from queued -> processing.
     */
    if (processingJob.status === "cancelled") {
      console.log(`🛑 Job already cancelled: ${jobId}`);

      return {
        jobId,
        status: "cancelled",
      };
    }

    if (processingJob.status !== "processing") {
      throw new Error(
        `Job ${jobId} is not ready for processing. Current status: ${processingJob.status}`,
      );
    }

    const results = await Result.find({
      jobId,
      status: "pending",
    }).sort({ rowNum: 1 });

    if (results.length === 0) {
      throw new Error(`No pending results found for job ${jobId}`);
    }

    const totalRows = results.length;

    let processedRows = 0;
    let successfulRows = 0;
    let failedRows = 0;

    const enrichmentEnabled =
      processingJob.processingOptions?.enrichmentEnabled === true;

    console.log(`📊 Processing ${totalRows} rows`);

    console.log(`✨ Enrichment enabled: ${enrichmentEnabled}`);

    if (uploadId) {
      await updateUploadStatus(uploadId, "processing");

      await updateUploadProgress(uploadId, {
        totalRows,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
      });
    }

    try {
      for (const result of results) {
        /*
         * Allow cancellation while the worker is running.
         */
        const currentJob = await Job.findById(jobId).select("status").lean();

        if (!currentJob) {
          throw new Error(`Job ${jobId} no longer exists`);
        }

        if (currentJob.status === "cancelled") {
          console.log(`🛑 Processing cancelled: ${jobId}`);

          if (uploadId) {
            await updateUploadStatus(uploadId, "cancelled");
          }

          return {
            jobId,
            status: "cancelled",
            processedRows,
            successfulRows,
            failedRows,
          };
        }

        try {
          result.status = "processing";
          await result.save();

          /*
           * STEP 1
           * Process / normalize the row.
           */
          const processedResult = await processRow(result);

          result.processedData = processedResult.processedData;

          /*
           * STEP 2
           * Optional enrichment.
           */
          if (enrichmentEnabled) {
            const enrichmentResult = await enrichRow(result.processedData);

            result.enrichmentData = enrichmentResult;
          }

          /*
           * STEP 3
           * Mark row successful.
           */
          result.status = "completed";
          result.error = {
            message: null,
            code: null,
          };
          result.processedAt = new Date();

          await result.save();

          successfulRows++;
        } catch (error) {
          /*
           * Individual row failure should NOT
           * stop the entire bulk job.
           */
          result.status = "failed";

          result.error = {
            message: error.message || "Row processing failed",

            code: error.code || "PROCESSING_ERROR",
          };

          result.processedAt = new Date();

          await result.save();

          failedRows++;

          console.error(`❌ Row ${result.rowNum} failed:`, error.message);
        }

        processedRows++;

        const progress = Math.min(
          Math.round((processedRows / totalRows) * 100),
          100,
        );

        /*
         * Update Job progress.
         */
        await updateJobProgress(jobId, {
          totalRows,
          processedRows,
          successfulRows,
          failedRows,
        });

        /*
         * Update Upload progress.
         */
        if (uploadId) {
          await updateUploadProgress(uploadId, {
            totalRows,
            processedRows,
            successfulRows,
            failedRows,
          });
        }

        /*
         * Update BullMQ progress.
         */
        await job.updateProgress(progress);
      }

      /*
       * All rows processed.
       */
      await completeJob(jobId, {
        totalRows,
        processedRows,
        successfulRows,
        failedRows,
      });

      /*
       * Update Upload status.
       */
      if (uploadId) {
        await updateUploadProgress(uploadId, {
          totalRows,
          processedRows,
          successfulRows,
          failedRows,
        });

        await updateUploadStatus(
          uploadId,
          failedRows > 0 ? "completed_with_errors" : "completed",
        );
      }

      console.log(`✅ Processing completed: ${jobId}`);

      return {
        jobId,
        uploadId,
        status: failedRows > 0 ? "completed_with_errors" : "completed",

        totalRows,
        processedRows,
        successfulRows,
        failedRows,
      };
    } catch (error) {
      /*
       * This is a JOB-level failure.
       *
       * Individual row errors are handled above
       * and do not reach this block.
       */
      console.error(`❌ Processing worker failed for ${jobId}:`, error.message);

      try {
        await failJob(jobId, error);

        if (uploadId) {
          await updateUploadStatus(uploadId, "failed");
        }
      } catch (statusError) {
        console.error(
          `❌ Failed to update failure status for ${jobId}:`,
          statusError.message,
        );
      }

      throw error;
    }
  },

  {
    connection: createRedisConnection(),
  },
);

/*
 * Worker events
 */

processingWorker.on("completed", (job) => {
  console.log(`✅ Processing worker completed: ${job.id}`);
});

processingWorker.on("failed", (job, error) => {
  console.error(`❌ Processing worker failed: ${job?.id}`, error.message);
});

processingWorker.on("error", (error) => {
  console.error("❌ Processing worker error:", error);
});

module.exports = processingWorker;
