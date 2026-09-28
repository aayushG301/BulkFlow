const { processRow } = require("../modules/processing/processing.service");

const { enrichRow } = require("../modules/enrichment/enrichment.service");

const processResult = async (result, enrichmentEnabled = false) => {
  if (!result?.originalData) {
    const error = new Error("Result contains no original data");

    error.code = "INVALID_RESULT";
    throw error;
  }

  const processed = await processRow(result);

  const data = {
    processedData: processed.processedData,
    enrichmentData: null,
  };

  if (enrichmentEnabled) {
    data.enrichmentData = await enrichRow(data.processedData);
  }

  return data;
};

module.exports = {
  processResult,
};
