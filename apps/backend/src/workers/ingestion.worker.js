const { Worker } = require("bullmq");

const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Upload = require("../modules/uploads/upload.model");
const Job = require("../modules/jobs/job.model");

const { createManyResults } = require("../modules/results/result.service");

const { addProcessingJob } = require("../queues/processing.queue");

const { parseFile } = require("../services/file-parser.service");

const ingestionWorker = new Worker(
  QUEUE_NAMES.INGESTION,
  async (job) => {
    const { uploadId, jobId } = job.data;

    console.log(`Starting ingestion: ${jobId}`);

    // 1. Find upload
    const upload = await Upload.findById(uploadId);

    if (!upload) {
      throw new Error(`Upload ${uploadId} not found`);
    }

    // 2. Find job
    const processingJob = await Job.findById(jobId);

    if (!processingJob) {
      throw new Error(`Job ${jobId} not found`);
    }

    // 3. Mark job as processing
    processingJob.status = "processing";
    processingJob.startedAt = new Date();

    await processingJob.save();

    // 4. Parse file
    const rows = await parseFile(upload.filePath);

    console.log(`${rows.length} rows found`);

    if (rows.length === 0) {
      throw new Error("Uploaded file contains no data rows");
    }

    // 5. Create result documents
    const results = rows.map((row, index) => ({
      jobId,
      rowNum: index + 1,
      originalData: row,
      status: "pending",
    }));

    await createManyResults(results);

    // 6. Update job statistics
    processingJob.processStats.totalRows = rows.length;
    processingJob.processStats.processedRows = 0;
    processingJob.processStats.successfulRows = 0;
    processingJob.processStats.failedRows = 0;
    processingJob.progress = 0;

    await processingJob.save();

    // 7. Add processing job
    await addProcessingJob({
      jobId: jobId.toString(),
      uploadId: uploadId.toString(),
    });

    console.log(`Processing job queued: ${jobId}`);

    return {
      jobId,
      uploadId,
      totalRows: rows.length,
    };
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
  console.error("❌ Ingestion worker error:", error);
});

module.exports = ingestionWorker;
