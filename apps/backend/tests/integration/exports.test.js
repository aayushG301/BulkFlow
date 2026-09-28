const request = require("supertest");
const fs = require("fs/promises");
const path = require("path");

const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  closeQueueConnections,
} = require("../helpers/db");

const {
  app,
  createTestUser,
  createTestUpload,
  createTestJob,
  authHeader,
} = require("../helpers/factories");

const Export = require("../../src/modules/exports/export.model");
const { exportQueue } = require("../../src/queues/export.queue");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

const exportDirectory = path.resolve(process.cwd(), "exports");

maybeDescribe("Exports API", () => {
  beforeAll(async () => {
    await connectTestDB();
    await fs.mkdir(exportDirectory, { recursive: true });
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
    await closeQueueConnections();
  });

  describe("POST /api/v1/exports/jobs/:jobId", () => {
    test("queues an export once the job has completed", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "completed",
      });

      const response = await request(app)
        .post(`/api/v1/exports/jobs/${job._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(202);
      expect(response.body.data.status).toBe("queued");

      const waitingJobs = await exportQueue.getJobs(["waiting", "delayed"]);
      const queuedForThisExport = waitingJobs.find(
        (queueJob) => queueJob.data.exportId === response.body.data._id,
      );

      expect(queuedForThisExport).toBeDefined();
    });

    test("rejects exporting a job that has not finished processing", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "processing",
      });

      const response = await request(app)
        .post(`/api/v1/exports/jobs/${job._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/exports/:exportId/download", () => {
    const createCompletedExport = async ({
      userId,
      jobId,
      fileName,
      content,
    }) => {
      const filePath = path.join(exportDirectory, fileName);

      await fs.writeFile(filePath, content, "utf8");

      return Export.create({
        jobId,
        userId,
        format: "csv",
        status: "completed",
        fileName,
        filePath,
      });
    };

    test("streams the file for the owner once the export is completed", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "completed",
      });

      const exportRecord = await createCompletedExport({
        userId: user._id,
        jobId: job._id,
        fileName: "bulkflow-export-download-test.csv",
        content: "rowNum,status\n1,completed\n",
      });

      const response = await request(app)
        .get(`/api/v1/exports/${exportRecord._id}/download`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.headers["content-disposition"]).toContain(
        "bulkflow-export-download-test.csv",
      );
      expect(response.text).toBe("rowNum,status\n1,completed\n");
    });

    test("rejects downloading before the export has completed", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "completed",
      });

      const exportRecord = await Export.create({
        jobId: job._id,
        userId: user._id,
        format: "csv",
        status: "queued",
      });

      const response = await request(app)
        .get(`/api/v1/exports/${exportRecord._id}/download`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
    });

    test("rejects downloading another user's export", async () => {
      const { token } = await createTestUser();
      const { user: otherUser } = await createTestUser();
      const upload = await createTestUpload(otherUser._id);
      const job = await createTestJob(otherUser._id, upload._id, {
        status: "completed",
      });

      const exportRecord = await createCompletedExport({
        userId: otherUser._id,
        jobId: job._id,
        fileName: "bulkflow-export-not-yours.csv",
        content: "rowNum,status\n1,completed\n",
      });

      const response = await request(app)
        .get(`/api/v1/exports/${exportRecord._id}/download`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
    });

    test("returns 404 when the file has been removed from disk", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "completed",
      });

      const missingFilePath = path.join(
        exportDirectory,
        "bulkflow-export-missing.csv",
      );

      const exportRecord = await Export.create({
        jobId: job._id,
        userId: user._id,
        format: "csv",
        status: "completed",
        fileName: "bulkflow-export-missing.csv",
        filePath: missingFilePath,
      });

      const response = await request(app)
        .get(`/api/v1/exports/${exportRecord._id}/download`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
    });

    test("rejects a record whose stored path escapes the exports directory", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "completed",
      });

      // Simulate a corrupted/tampered record pointing outside exports/
      const outsidePath = path.resolve(exportDirectory, "..", "outside.csv");

      await fs.writeFile(outsidePath, "secret", "utf8");

      const exportRecord = await Export.create({
        jobId: job._id,
        userId: user._id,
        format: "csv",
        status: "completed",
        fileName: "outside.csv",
        filePath: outsidePath,
      });

      const response = await request(app)
        .get(`/api/v1/exports/${exportRecord._id}/download`)
        .set(authHeader(token));

      expect(response.status).toBe(400);

      await fs.unlink(outsidePath).catch(() => {});
    });
  });
});
