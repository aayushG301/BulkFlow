const calculateProgress = (processedRows, totalRows) => {
  if (!totalRows || totalRows <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((processedRows / totalRows) * 100));
};

const calculateRemainingRows = (processedRows, totalRows) => {
  return Math.max(0, totalRows - processedRows);
};

const determineJobStatus = (failedRows) => {
  return failedRows > 0 ? "completed_with_errors" : "completed";
};

const validateProcessingData = (data) => {
  if (!data || typeof data !== "object") {
    const error = new Error("Processing data must be an object");

    error.code = "INVALID_PROCESSING_DATA";

    throw error;
  }

  return true;
};

module.exports = {
  calculateProgress,
  calculateRemainingRows,
  determineJobStatus,
  validateProcessingData,
};
