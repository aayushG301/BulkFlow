const env = require("../../config/env");

const { enrichWithMock, enrichWithGemini } = require("./enrichment.provider");

const {
  normalizeEnrichmentInput,
  buildEnrichmentResult,
} = require("./enrichment.utils");

// ----------------------------------------
// Enrich A Single Row
// ----------------------------------------
// `provider` is whatever was chosen at upload time ("mock" | "gemini").
// Falls back to the mock provider - with a clear server-side warning -
// when Gemini is requested but no API key is configured, so a missing
// key degrades gracefully instead of failing every row in the job.
const enrichRow = async (data, provider = "mock") => {
  const normalizedData = normalizeEnrichmentInput(data);

  let resolvedProvider = provider;

  if (provider === "gemini" && !env.GEMINI_API_KEY) {
    console.warn(
      "⚠️ Gemini enrichment requested but GEMINI_API_KEY is not set - falling back to the mock provider.",
    );

    resolvedProvider = "mock";
  }

  const enrichmentResult =
    resolvedProvider === "gemini"
      ? await enrichWithGemini(normalizedData, {
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL,
        })
      : await enrichWithMock(normalizedData);

  return buildEnrichmentResult(enrichmentResult);
};

// ----------------------------------------
// Enrich Many Rows
// ----------------------------------------
// Used by tests and any future batch caller - reports per-row
// success/failure rather than throwing, so one bad row never loses
// the results of the rest of the batch.
const enrichRows = async (rows, provider = "mock") => {
  return Promise.all(
    rows.map(async (row) => {
      try {
        const result = await enrichRow(row, provider);

        return { success: true, result };
      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code || "ENRICHMENT_FAILED",
          },
        };
      }
    }),
  );
};

module.exports = {
  enrichRow,
  enrichRows,
};
