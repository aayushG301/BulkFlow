const { Queue } = require("bullmq");
const createRedisConnection = require("./queue.connection");

const {
  QUEUE_NAMES,
  JOB_TYPES,
  DEFAULT_JOB_OPTIONS,
} = require("./queue.constants");

const exportQueue = new Queue(QUEUE_NAMES.EXPORT, {
  connection: createRedisConnection(),
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

const addExportJob = async ({ exportId, jobId, userId, format }) => {
  return exportQueue.add(JOB_TYPES.EXPORT_RESULTS, {
    exportId,
    jobId,
    userId,
    format,
  });
};

module.exports = {
  exportQueue,
  addExportJob,
};
