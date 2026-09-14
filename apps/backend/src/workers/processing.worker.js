const { Worker } = require("bullmq");

const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Job = require("../modules/jobs/job.model");
const Result = require("../modules/results/result.model");

const processingWorker = new Worker(
  QUEUE_NAMES.PROCESSING,
  async (job) => {
    const { jobId } = job.data;

    console.log(`Starting processing: ${jobId}`);

    // Find the BulkFlow job
    const processingJob = await Job.findById(jobId);

    if (!processingJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Find pending results
    const results = await Result.find({
      jobId,
      status: "pending",
    }).sort({ rowNum: 1 });

    if (results.length === 0) {
      throw new Error(`No pending results found for job ${jobId}`);
    }

    let processedRows = 0;
    let successfulRows = 0;
    let failedRows = 0;

    for (const result of results) {
      try {
        // Mark row as processing
        result.status = "processing";
        await result.save();

        /*
         * Actual processing/enrichment will go here.
         *
         * Example later:
         *
         * const processedData = await processRow(
         *   result.originalData,
         *   processingJob.processingOptions
         * );
         */

        const processedData = result.originalData;

        // Save processed result
        result.processedData = processedData;
        result.status = "completed";
        result.processedAt = new Date();

        await result.save();

        successfulRows++;
      } catch (error) {
        result.status = "failed";

        result.error = {
          message: error.message,
          code: error.code || "PROCESSING_ERROR",
        };

        await result.save();

        failedRows++;
      }

      processedRows++;

      // Calculate progress
      const progress = Math.round((processedRows / results.length) * 100);

      // Update job statistics
      processingJob.processStats.processedRows = processedRows;
      processingJob.processStats.successfulRows = successfulRows;
      processingJob.processStats.failedRows = failedRows;
      processingJob.progress = progress;

      await processingJob.save();

      // Update BullMQ progress
      await job.updateProgress(progress);
    }

    // Final job status
    if (failedRows > 0) {
      processingJob.status = "completed_with_errors";
    } else {
      processingJob.status = "completed";
    }

    processingJob.completedAt = new Date();
    processingJob.progress = 100;

    await processingJob.save();

    console.log(`✅ Processing completed: ${jobId}`);

    return {
      jobId,
      totalRows: results.length,
      processedRows,
      successfulRows,
      failedRows,
    };
  },
  {
    connection: createRedisConnection(),
  },
);

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
