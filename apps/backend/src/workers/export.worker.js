const fs = require("fs");
const path = require("path");
const { Worker } = require("bullmq");

const createRedisConnection = require("../queues/queue.connection");
const { QUEUE_NAMES } = require("../queues/queue.constants");

const Export = require("../modules/exports/export.model");
const Result = require("../modules/results/result.model");

const exportDirectory = path.join(process.cwd(), "exports");

// ----------------------------------------
// Export Directory
// ----------------------------------------

if (!fs.existsSync(exportDirectory)) {
  fs.mkdirSync(exportDirectory, {
    recursive: true,
  });
}

// ----------------------------------------
// CSV Helpers
// ----------------------------------------

const escapeCSVValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  let stringValue;

  if (typeof value === "object") {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }

  if (
    stringValue.includes('"') ||
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const collectHeaders = (results) => {
  const headers = new Set();

  for (const result of results) {
    const originalData = result.originalData || {};
    const processedData = result.processedData || {};

    Object.keys(originalData).forEach((key) => {
      headers.add(key);
    });

    Object.keys(processedData).forEach((key) => {
      headers.add(key);
    });
  }

  return Array.from(headers);
};

// ----------------------------------------
// Worker
// ----------------------------------------

const exportWorker = new Worker(
  QUEUE_NAMES.EXPORT,
  async (job) => {
    const { exportId, jobId } = job.data;

    console.log(`📤 Starting export: ${exportId}`);

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
      })
        .sort({ rowNum: 1 })
        .lean();

      if (results.length === 0) {
        throw new Error("No results found for this job");
      }

      const headers = collectHeaders(results);

      const csvRows = [];

      csvRows.push(["rowNum", "status", ...headers]);

      for (const result of results) {
        const row = [result.rowNum, result.status];

        for (const header of headers) {
          const value =
            result.processedData?.[header] ??
            result.originalData?.[header] ??
            "";

          row.push(value);
        }

        csvRows.push(row);
      }

      const csvContent = csvRows
        .map((row) => row.map(escapeCSVValue).join(","))
        .join("\n");

      const fileName = `bulkflow-export-${jobId}-${Date.now()}.csv`;

      const filePath = path.join(exportDirectory, fileName);

      await fs.promises.writeFile(filePath, csvContent, "utf8");

      exportRecord.status = "completed";
      exportRecord.fileName = fileName;
      exportRecord.filePath = filePath;
      exportRecord.completedAt = new Date();

      await exportRecord.save();

      console.log(`✅ Export completed: ${exportId}`);

      return {
        exportId,
        jobId,
        fileName,
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

// ----------------------------------------
// Worker Events
// ----------------------------------------

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
