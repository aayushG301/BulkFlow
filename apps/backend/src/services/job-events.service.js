const { getIO } = require("../socket");
const { SOCKET_EVENTS, jobRoom } = require("../socket/socket.constants");

const emit = (event, jobId, data = {}) => {
  try {
    getIO()
      .to(jobRoom(jobId))
      .emit(event, {
        jobId,
        ...data,
      });
  } catch (error) {
    console.error(`⚠️ Socket event failed [${event}]:`, error.message);
  }
};

const emitJobStatus = (jobId, status, data = {}) =>
  emit(SOCKET_EVENTS.JOB_STATUS, jobId, {
    status,
    ...data,
  });

const emitJobProgress = (jobId, data) =>
  emit(SOCKET_EVENTS.JOB_PROGRESS, jobId, data);

const emitJobCompleted = (jobId, data = {}) =>
  emit(SOCKET_EVENTS.JOB_COMPLETED, jobId, data);

const emitJobFailed = (jobId, error) =>
  emit(SOCKET_EVENTS.JOB_FAILED, jobId, {
    error: {
      message: error?.message || "Job failed",
      code: error?.code || "JOB_ERROR",
    },
  });

module.exports = {
  emitJobStatus,
  emitJobProgress,
  emitJobCompleted,
  emitJobFailed,
};
