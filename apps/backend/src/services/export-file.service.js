const fs = require("fs");
const path = require("path");

// ----------------------------------------
// Export Directory
// ----------------------------------------

const exportDirectory = path.join(process.cwd(), "exports");

const ensureExportDirectory = async () => {
  await fs.promises.mkdir(exportDirectory, {
    recursive: true,
  });
};

// ----------------------------------------
// Escape CSV Value
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

// ----------------------------------------
// Collect Headers
// ----------------------------------------

const collectHeaders = (results) => {
  const headers = new Set();

  for (const result of results) {
    Object.keys(result.originalData || {}).forEach((key) => headers.add(key));

    Object.keys(result.processedData || {}).forEach((key) => headers.add(key));
  }

  return Array.from(headers);
};

// ----------------------------------------
// Create CSV
// ----------------------------------------

const createCSVFile = async (results, jobId) => {
  if (!Array.isArray(results)) {
    throw new Error("Results must be an array");
  }

  await ensureExportDirectory();

  const headers = collectHeaders(results);

  const rows = [];

  rows.push(["rowNum", "status", ...headers]);

  for (const result of results) {
    const row = [result.rowNum, result.status];

    for (const header of headers) {
      const value =
        result.processedData?.[header] ?? result.originalData?.[header] ?? "";

      row.push(value);
    }

    rows.push(row);
  }

  const csvContent = rows
    .map((row) => row.map(escapeCSVValue).join(","))
    .join("\n");

  const fileName = `bulkflow-export-${jobId}-${Date.now()}.csv`;

  const filePath = path.join(exportDirectory, fileName);

  await fs.promises.writeFile(filePath, csvContent, "utf8");

  return {
    fileName,
    filePath,
  };
};

module.exports = {
  createCSVFile,
};
