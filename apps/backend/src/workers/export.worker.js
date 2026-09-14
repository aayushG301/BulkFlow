const { Worker } = require("bullmq");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");

const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Job = require("../modules/jobs/job.model");
const Result = require("../modules/results/result.model");

const EXPORT_DIR = path.join(process.cwd(), "storage", "exports");

const ensureExportDirectory = () => {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, {
      recursive: true,
    });
  }
};

const generateCSV = (results, filePath) => {
  const rows = results.map((result) => ({
    rowNum: result.rowNum,
    ...result.originalData,
    ...(result.processedData && typeof result.processedData === "object"
      ? result.processedData
      : {}),
    status: result.status,
    error: result.error?.message || null,
  }));

  const parser = new Parser();
  const csv = parser.parse(rows);

  fs.writeFileSync(filePath, csv);
};

const generateXLSX = (results, filePath) => {
  const rows = results.map((result) => ({
    rowNum: result.rowNum,
    ...result.originalData,
    ...(result.processedData && typeof result.processedData === "object"
      ? result.processedData
      : {}),
    status: result.status,
    error: result.error?.message || null,
  }));

  const workbook = XLSX.utils.book_new();

  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

  XLSX.writeFile(workbook, filePath);
};

const exportWorker = new Worker(
  QUEUE_NAMES.EXPORT,
  async (job) => {
    const { jobId, userId, format = "csv" } = job.data;

    console.log(`📤 Starting export: ${jobId}`);

    // Verify job ownership
    const processingJob = await Job.findOne({
      _id: jobId,
      userId,
    });

    if (!processingJob) {
      throw new Error("Job not found");
    }

    // Get results
    const results = await Result.find({
      jobId,
    })
      .sort({ rowNum: 1 })
      .lean();

    if (results.length === 0) {
      throw new Error("No results available for export");
    }

    ensureExportDirectory();

    const extension = format === "xlsx" ? "xlsx" : "csv";

    const fileName = `bulkflow-${jobId}-${Date.now()}.${extension}`;

    const filePath = path.join(EXPORT_DIR, fileName);

    // Generate file
    if (format === "xlsx") {
      generateXLSX(results, filePath);
    } else {
      generateCSV(results, filePath);
    }

    console.log(`✅ Export completed: ${fileName}`);

    return {
      jobId,
      userId,
      format,
      fileName,
      filePath,
    };
  },
  {
    connection: createRedisConnection(),
  },
);

exportWorker.on("completed", (job) => {
  console.log(`✅ Export worker completed: ${job.id}`);
});

exportWorker.on("failed", (job, error) => {
  console.error(`❌ Export worker failed: ${job?.id}`, error.message);
});

exportWorker.on("error", (error) => {
  console.error("❌ Export worker error:", error);
});

module.exports = exportWorker;
