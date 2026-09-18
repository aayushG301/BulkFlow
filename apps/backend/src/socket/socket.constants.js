const SOCKET_EVENTS = {
  JOIN_JOB: "job:join",
  LEAVE_JOB: "job:leave",

  JOB_STATUS: "job:status",
  JOB_PROGRESS: "job:progress",
  JOB_COMPLETED: "job:completed",
  JOB_FAILED: "job:failed",
};

const jobRoom = (jobId) => `job:${jobId}`;

module.exports = {
  SOCKET_EVENTS,
  jobRoom,
};
