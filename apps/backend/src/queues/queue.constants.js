const QUEUE_NAMES = {
  INGESTION: "ingestion",
  PROCESSING: "processing",
  EXPORT: "export",
};

const JOB_TYPES = {
  INGEST_FILE: "ingest_file",
  PROCESS_ROWS: "process_rows",
  EXPORT_RESULTS: "export_results",
};

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

module.exports = {
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
};