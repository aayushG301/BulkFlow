const request = require("supertest");
const fs = require("fs");
const os = require("os");
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

const Job = require("../../src/modules/jobs/job.model");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

const sampleCSVPath = path.join(os.tmpdir(), "bulkflow-upload-sample.csv");

maybeDescribe("Uploads API", () => {
  beforeAll(async () => {
    await connectTestDB();

    fs.writeFileSync(sampleCSVPath, "name,email\nAda,ada@example.com\n");
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
    await closeQueueConnections();

    if (fs.existsSync(sampleCSVPath)) {
      fs.unlinkSync(sampleCSVPath);
    }
  });

  describe("POST /api/v1/uploads", () => {
    test("requires authentication", async () => {
      const response = await request(app)
        .post("/api/v1/uploads")
        .attach("file", sampleCSVPath)
        .field("enrichmentEnabled", "false");

      expect(response.status).toBe(401);
    });

    test("creates an upload from a CSV file", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post("/api/v1/uploads")
        .set(authHeader(token))
        .attach("file", sampleCSVPath)
        .field("enrichmentEnabled", "false");

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe("queued");
      expect(response.body.data.file.originalName).toBe(
        "bulkflow-upload-sample.csv",
      );
    });

    test("rejects an unsupported file type", async () => {
      const { token } = await createTestUser();

      const badFilePath = path.join(os.tmpdir(), "bulkflow-upload-bad.txt");
      fs.writeFileSync(badFilePath, "not a spreadsheet");

      const response = await request(app)
        .post("/api/v1/uploads")
        .set(authHeader(token))
        .attach("file", badFilePath)
        .field("enrichmentEnabled", "false");

      expect(response.status).toBe(400);

      fs.unlinkSync(badFilePath);
    });

    test("requires an enrichment provider when enrichment is enabled", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post("/api/v1/uploads")
        .set(authHeader(token))
        .attach("file", sampleCSVPath)
        .field("enrichmentEnabled", "true");

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/uploads", () => {
    test("only returns the authenticated user's uploads, honoring pagination", async () => {
      const { user, token } = await createTestUser();
      const { user: otherUser } = await createTestUser();

      for (let i = 0; i < 3; i += 1) {
        await createTestUpload(user._id);
      }

      await createTestUpload(otherUser._id);

      const response = await request(app)
        .get("/api/v1/uploads")
        .query({ page: 1, limit: 2 })
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.uploads).toHaveLength(2);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });
  });

  describe("GET /api/v1/uploads/:uploadId", () => {
    test("returns 404 for another user's upload", async () => {
      const { token } = await createTestUser();
      const { user: otherUser } = await createTestUser();

      const upload = await createTestUpload(otherUser._id);

      const response = await request(app)
        .get(`/api/v1/uploads/${upload._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/uploads/:uploadId/cancel", () => {
    test("cancels a queued upload", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "queued" });

      const response = await request(app)
        .patch(`/api/v1/uploads/${upload._id}/cancel`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("cancelled");
    });

    test("rejects cancelling an already-completed upload", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, {
        status: "completed",
      });

      const response = await request(app)
        .patch(`/api/v1/uploads/${upload._id}/cancel`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/uploads/:uploadId/retry", () => {
    test("requeues a failed upload", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "failed" });

      const response = await request(app)
        .patch(`/api/v1/uploads/${upload._id}/retry`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("queued");
    });

    test("actually re-queues ingestion for the upload's job, not just the status label", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "failed" });
      const job = await createTestJob(user._id, upload._id, { status: "failed" });

      const response = await request(app)
        .patch(`/api/v1/uploads/${upload._id}/retry`)
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const { ingestionQueue } = require("../../src/queues/ingestion.queue");
      const waitingJobs = await ingestionQueue.getJobs(["waiting", "delayed"]);
      const queuedForThisJob = waitingJobs.find(
        (queueJob) => queueJob.data.jobId === job._id.toString(),
      );

      expect(queuedForThisJob).toBeDefined();

      const refreshedJob = await Job.findById(job._id);
      expect(refreshedJob.status).toBe("queued");
    });

    test("rejects retrying an upload that is not failed", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "queued" });

      const response = await request(app)
        .patch(`/api/v1/uploads/${upload._id}/retry`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/uploads/:uploadId", () => {
    test("deletes an upload owned by the user", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);

      const response = await request(app)
        .delete(`/api/v1/uploads/${upload._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const followUp = await request(app)
        .get(`/api/v1/uploads/${upload._id}`)
        .set(authHeader(token));

      expect(followUp.status).toBe(404);
    });
  });
});
