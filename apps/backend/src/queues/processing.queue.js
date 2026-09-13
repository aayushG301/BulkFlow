const { Queue } = require("bullmq");

const createRedisConnection = require("./queue.connection");

const {
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
} = require("./queue.constants");

const processingQueue = new Queue(QUEUE_NAMES.PROCESSING, {
  connection: createRedisConnection(),
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

const addProcessingJob = async (data) => {
  return processingQueue.add(JOB_TYPES.PROCESS_ROWS, data);
};

module.exports = {
  processingQueue,
  addProcessingJob,
};