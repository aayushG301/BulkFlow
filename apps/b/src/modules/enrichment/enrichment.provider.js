const enrich = async (data) => {
  if (!data) {
    const error = new Error("Data is required for enrichment");

    error.code = "ENRICHMENT_DATA_REQUIRED";

    throw error;
  }

  return {
    provider: "mock",
    data: {
      ...data,
    },
  };
};

module.exports = {
  enrich,
};
