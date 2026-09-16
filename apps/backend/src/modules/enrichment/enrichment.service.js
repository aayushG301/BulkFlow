const {
  normalizeEnrichmentInput,
  buildEnrichmentResult,
} = require("./enrichment.utils");

const { enrich } = require("./enrichment.provider");

const enrichRow = async (data) => {
  const normalizedData = normalizeEnrichmentInput(data);

  const enrichmentResult = await enrich(normalizedData);

  return buildEnrichmentResult(enrichmentResult);
};

const enrichRows = async (rows) => {
  if (!Array.isArray(rows)) {
    const error = new Error("Rows must be an array");

    error.code = "ROWS_MUST_BE_ARRAY";

    throw error;
  }

  const results = [];

  for (const row of rows) {
    try {
      const result = await enrichRow(row);

      results.push({
        success: true,
        ...result,
      });
    } catch (error) {
      results.push({
        success: false,
        error: {
          message: error.message,
          code: error.code || "ENRICHMENT_ERROR",
        },
      });
    }
  }

  return results;
};

module.exports = {
  enrichRow,
  enrichRows,
};
