const { Server } = require("socket.io");
const env = require("./config/env");
const socketAuth = require("./socket/socket-auth.middleware");
const { SOCKET_EVENTS, jobRoom } = require("./socket/socket.constants");
const Job = require("./modules/jobs/job.model");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on(SOCKET_EVENTS.JOIN_JOB, async (jobId, callback) => {
      try {
        const job = await Job.findOne({
          _id: jobId,
          userId: socket.user.id,
        }).lean();

        if (!job) {
          return callback?.({
            success: false,
            message: "Job not found",
          });
        }

        socket.join(jobRoom(jobId));

        socket.emit(SOCKET_EVENTS.JOB_STATUS, {
          jobId,
          status: job.status,
          progress: job.progress,
          processStats: job.processStats,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        });

        callback?.({
          success: true,
          message: "Joined job room",
        });
      } catch (error) {
        callback?.({
          success: false,
          message: error.message,
        });
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_JOB, (jobId) => {
      if (jobId) socket.leave(jobRoom(jobId));
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
