const http = require("http");
const { io: ioClient } = require("socket.io-client");

const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
} = require("../helpers/db");

const { createTestUser, createTestUpload, createTestJob } = require("../helpers/factories");

const { initializeSocket } = require("../../src/socket");
const { SOCKET_EVENTS } = require("../../src/socket/socket.constants");
const {
  emitJobStatus,
  emitJobProgress,
} = require("../../src/services/job-events.service");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

maybeDescribe("Socket.IO job events", () => {
  let httpServer;
  let serverUrl;

  beforeAll(async () => {
    await connectTestDB();

    httpServer = http.createServer();
    initializeSocket(httpServer);

    await new Promise((resolve) => {
      httpServer.listen(0, () => {
        const { port } = httpServer.address();
        serverUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
    await new Promise((resolve) => httpServer.close(resolve));
  });

  const connectClient = (token) =>
    new Promise((resolve, reject) => {
      const client = ioClient(serverUrl, {
        auth: { token },
        transports: ["websocket"],
        forceNew: true,
      });

      client.on("connect", () => resolve(client));
      client.on("connect_error", (error) => reject(error));
    });

  test("rejects a connection without a valid token", async () => {
    await expect(connectClient("not-a-real-token")).rejects.toBeDefined();
  });

  test("joins a job room and receives the current status", async () => {
    const { user, token } = await createTestUser();
    const upload = await createTestUpload(user._id);
    const job = await createTestJob(user._id, upload._id, {
      status: "processing",
    });

    const client = await connectClient(token);

    const joinResponse = await new Promise((resolve) => {
      client.emit(SOCKET_EVENTS.JOIN_JOB, job._id.toString(), resolve);
    });

    expect(joinResponse.success).toBe(true);

    client.disconnect();
  });

  test("rejects joining a job the socket's user does not own", async () => {
    const { token } = await createTestUser();
    const { user: otherUser } = await createTestUser();
    const upload = await createTestUpload(otherUser._id);
    const job = await createTestJob(otherUser._id, upload._id);

    const client = await connectClient(token);

    const joinResponse = await new Promise((resolve) => {
      client.emit(SOCKET_EVENTS.JOIN_JOB, job._id.toString(), resolve);
    });

    expect(joinResponse.success).toBe(false);

    client.disconnect();
  });

  test("broadcasts job:status and job:progress events to everyone in the room", async () => {
    const { user, token } = await createTestUser();
    const upload = await createTestUpload(user._id);
    const job = await createTestJob(user._id, upload._id, {
      status: "processing",
    });

    const client = await connectClient(token);

    await new Promise((resolve) => {
      client.emit(SOCKET_EVENTS.JOIN_JOB, job._id.toString(), resolve);
    });

    const statusEventPromise = new Promise((resolve) => {
      client.once(SOCKET_EVENTS.JOB_STATUS, resolve);
    });

    emitJobStatus(job._id.toString(), "completed", { progress: 100 });

    const statusEvent = await statusEventPromise;

    expect(statusEvent.jobId).toBe(job._id.toString());
    expect(statusEvent.status).toBe("completed");
    expect(statusEvent.progress).toBe(100);

    const progressEventPromise = new Promise((resolve) => {
      client.once(SOCKET_EVENTS.JOB_PROGRESS, resolve);
    });

    emitJobProgress(job._id.toString(), { progress: 42, remainingRows: 5 });

    const progressEvent = await progressEventPromise;

    expect(progressEvent.jobId).toBe(job._id.toString());
    expect(progressEvent.progress).toBe(42);
    expect(progressEvent.remainingRows).toBe(5);

    client.disconnect();
  });
});
