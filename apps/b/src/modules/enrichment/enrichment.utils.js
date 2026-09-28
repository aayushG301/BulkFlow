const normalizeEnrichmentInput = (data) => {
  if (!data || typeof data !== "object") {
    const error = new Error("Enrichment input must be an object");

    error.code = "INVALID_ENRICHMENT_INPUT";

    throw error;
  }

  return data;
};

const buildEnrichmentResult = ({ provider, data }) => {
  return {
    provider,
    data,
    enrichedAt: new Date(),
  };
};

module.exports = {
  normalizeEnrichmentInput,
  buildEnrichmentResult,
};
