const { Worker } = require("bullmq");

const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Upload = require("../modules/uploads/upload.model");
const Job = require("../modules/jobs/job.model");

const { createManyResults } = require("../modules/results/result.service");

const { addProcessingJob } = require("../queues/processing.queue");

const { parseFile } = require("../services/file-parser.service");

const { deleteFile } = require("../services/file-cleanup.service");

const {
  markJobProcessing,
  failJob,
} = require("../services/job-status.service");

const {
  updateUploadProgress,
  updateUploadStatus,
} = require("../modules/uploads/upload.service");

const ingestionWorker = new Worker(
  QUEUE_NAMES.INGESTION,

  async (job) => {
    const { uploadId, jobId } = job.data;

    console.log(`📥 Starting ingestion: ${jobId}`);

    const upload = await Upload.findById(uploadId);

    if (!upload) {
      throw new Error(`Upload ${uploadId} not found`);
    }

    const processingJob = await Job.findById(jobId);

    if (!processingJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    /*
     * Do not process cancelled jobs.
     */
    if (processingJob.status === "cancelled" || upload.status === "cancelled") {
      console.log(
        `🛑 Ingestion skipped because job/upload is cancelled: ${jobId}`,
      );

      return {
        jobId,
        uploadId,
        status: "cancelled",
      };
    }

    /*
     * Mark job and upload as processing.
     */
    await markJobProcessing(jobId);

    await updateUploadStatus(uploadId, "processing");

    try {
      /*
       * Parse CSV/XLSX.
       */
      const rows = await parseFile(upload.file?.storageKey);

      console.log(`📊 ${rows.length} rows found`);

      if (rows.length === 0) {
        const error = new Error("Uploaded file contains no data rows");

        error.code = "EMPTY_FILE";

        throw error;
      }

      /*
       * Convert parsed rows into Result documents.
       */
      const results = rows.map((row, index) => ({
        jobId,
        rowNum: index + 1,
        originalData: row,
        processedData: null,
        status: "pending",
      }));

      /*
       * Store all rows.
       */
      await createManyResults(results);

      /*
       * Initialize Job statistics.
       */
      processingJob.processStats = {
        totalRows: rows.length,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
      };

      processingJob.progress = 0;

      await processingJob.save();

      /*
       * Initialize Upload statistics.
       */
      await updateUploadProgress(uploadId, {
        totalRows: rows.length,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
      });

      /*
       * Queue actual row processing.
       */
      await addProcessingJob({
        jobId: jobId.toString(),
        uploadId: uploadId.toString(),
      });

      console.log(`📤 Processing job queued: ${jobId}`);

      /*
       * The original upload file is no longer
       * needed after ingestion.
       *
       * IMPORTANT:
       * We are intentionally NOT deleting it yet.
       *
       * Keep the file until the entire pipeline
       * has been tested successfully.
       */

      return {
        jobId,
        uploadId,
        totalRows: rows.length,
      };
    } catch (error) {
      console.error(`❌ Ingestion failed for ${jobId}:`, error.message);

      /*
       * Mark Job as failed.
       */
      try {
        await failJob(jobId, error, "INGESTION_ERROR");
      } catch (statusError) {
        console.error(
          `❌ Failed to update job failure status:`,
          statusError.message,
        );
      }

      /*
       * Mark Upload as failed.
       */
      try {
        await updateUploadStatus(uploadId, "failed");
      } catch (uploadError) {
        console.error(
          `❌ Failed to update upload status:`,
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

ingestionWorker.on("completed", (job) => {
  console.log(`✅ Ingestion completed: ${job.id}`);
});

ingestionWorker.on("failed", (job, error) => {
  console.error(`❌ Ingestion worker failed: ${job?.id}`, error.message);
});

ingestionWorker.on("error", (error) => {
  console.error("❌ Ingestion worker error:", error);
});

module.exports = ingestionWorker;
