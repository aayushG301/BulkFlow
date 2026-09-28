const { Worker } = require("bullmq");
const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Upload = require("../modules/uploads/upload.model");
const Job = require("../modules/jobs/job.model");
const { createManyResults } = require("../modules/results/result.service");
const { addProcessingJob } = require("../queues/processing.queue");
const { parseFile } = require("../services/file-parser.service");

const { markJobProcessing, failJob } = require("../modules/jobs/job.service");

const {
  updateUploadProgress,
  updateUploadStatus,
} = require("../modules/uploads/upload.service");

const ingestionWorker = new Worker(
  QUEUE_NAMES.INGESTION,
  async (queueJob) => {
    const { uploadId, jobId } = queueJob.data;

    const upload = await Upload.findById(uploadId);
    const job = await Job.findById(jobId);

    if (!upload) throw new Error(`Upload ${uploadId} not found`);
    if (!job) throw new Error(`Job ${jobId} not found`);

    if (upload.status === "cancelled" || job.status === "cancelled") {
      return { jobId, uploadId, status: "cancelled" };
    }

    try {
      await markJobProcessing(jobId);
      await updateUploadStatus(uploadId, "processing");

      const rows = await parseFile(upload.file.storageKey);

      if (!rows.length) {
        const error = new Error("Uploaded file contains no data rows");
        error.code = "EMPTY_FILE";
        throw error;
      }

      await createManyResults(
        rows.map((row, index) => ({
          jobId,
          rowNum: index + 1,
          originalData: row,
          processedData: null,
          status: "pending",
        })),
      );

      job.processStats = {
        totalRows: rows.length,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
      };

      job.progress = 0;

      await job.save();

      await updateUploadProgress(uploadId, {
        totalRows: rows.length,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
      });

      await addProcessingJob({
        jobId: jobId.toString(),
        uploadId: uploadId.toString(),
      });

      return {
        jobId,
        uploadId,
        totalRows: rows.length,
      };
    } catch (error) {
      await failJob(jobId, error, "INGESTION_ERROR");

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

ingestionWorker.on("completed", (job) => {
  console.log(`✅ Ingestion completed: ${job.id}`);
});

ingestionWorker.on("failed", (job, error) => {
  console.error(`❌ Ingestion failed: ${job?.id}`, error.message);
});

ingestionWorker.on("error", (error) => {
  console.error("❌ Ingestion worker error:", error.message);
});

module.exports = ingestionWorker;
