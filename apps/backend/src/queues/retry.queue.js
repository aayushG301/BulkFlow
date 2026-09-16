const { Queue } = require("bullmq");
const createRedisConnection = require("./queue.connection");
const {
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
} = require("./queue.constants");

const retryQueue = new Queue(QUEUE_NAMES.PROCESSING, {
  connection: createRedisConnection(),
});

const addRetryJob = async ({ jobId, uploadId }) =>
  retryQueue.add(
    JOB_TYPES.PROCESS_ROWS,
    { jobId, uploadId },
    DEFAULT_JOB_OPTIONS,
  );

module.exports = {
  retryQueue,
  addRetryJob,
};
