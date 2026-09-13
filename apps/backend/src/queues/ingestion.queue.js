const { Queue } = require("bullmq");

const createRedisConnection = require("./queue.connection");

const {
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
} = require("./queue.constants");

const ingestionQueue = new Queue(QUEUE_NAMES.INGESTION, {
  connection: createRedisConnection(),
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

const addIngestionJob = async (data) => {
  return ingestionQueue.add(JOB_TYPES.INGEST_FILE, data);
};

module.exports = {
  ingestionQueue,
  addIngestionJob,
};