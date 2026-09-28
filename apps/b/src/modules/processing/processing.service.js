const { validateProcessingData } = require("./processing.utils");

const processRow = async (row) => {
  if (!row) {
    const error = new Error("Row is required");
    error.code = "ROW_REQUIRED";
    throw error;
  }

  const originalData = row.originalData || row;

  validateProcessingData(originalData);

  return {
    processedData: {
      ...originalData,
    },
  };
};

const processRows = async (rows) => {
  if (!Array.isArray(rows)) {
    const error = new Error("Rows must be an array");
    error.code = "ROWS_MUST_BE_ARRAY";
    throw error;
  }

  const processedResults = [];

  for (const row of rows) {
    try {
      const result = await processRow(row);

      processedResults.push({
        success: true,
        row,
        ...result,
      });
    } catch (error) {
      processedResults.push({
        success: false,
        row,
        error: {
          message: error.message,
          code: error.code || "PROCESSING_ERROR",
        },
      });
    }
  }

  return processedResults;
};

module.exports = {
  processRow,
  processRows,
};
