const request = require("supertest");

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
  createTestResults,
  authHeader,
} = require("../helpers/factories");

const Job = require("../../src/modules/jobs/job.model");
const { ingestionQueue } = require("../../src/queues/ingestion.queue");
const { processingQueue } = require("../../src/queues/processing.queue");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

maybeDescribe("Jobs API", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
    await closeQueueConnections();
  });

  describe("POST /api/v1/jobs", () => {
    test("creates a job and queues ingestion for the upload", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);

      const response = await request(app)
        .post("/api/v1/jobs")
        .set(authHeader(token))
        .send({ uploadId: upload._id.toString(), name: "My import" });

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe("queued");

      // The critical wiring fix: creating a job must enqueue ingestion
      const waitingJobs = await ingestionQueue.getJobs(["waiting", "delayed"]);
      const queuedForThisJob = waitingJobs.find(
        (queueJob) => queueJob.data.jobId === response.body.data._id,
      );

      expect(queuedForThisJob).toBeDefined();
    });

    test("rejects a second job for the same upload", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);

      await createTestJob(user._id, upload._id);

      const response = await request(app)
        .post("/api/v1/jobs")
        .set(authHeader(token))
        .send({ uploadId: upload._id.toString(), name: "Duplicate" });

      expect(response.status).toBe(409);
    });

    test("rejects an upload that belongs to another user", async () => {
      const { token } = await createTestUser();
      const { user: otherUser } = await createTestUser();
      const upload = await createTestUpload(otherUser._id);

      const response = await request(app)
        .post("/api/v1/jobs")
        .set(authHeader(token))
        .send({ uploadId: upload._id.toString(), name: "Not mine" });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/jobs", () => {
    test("paginates and scopes jobs to the authenticated user", async () => {
      const { user, token } = await createTestUser();
      const { user: otherUser } = await createTestUser();

      for (let i = 0; i < 3; i += 1) {
        const upload = await createTestUpload(user._id);
        await createTestJob(user._id, upload._id);
      }

      const otherUpload = await createTestUpload(otherUser._id);
      await createTestJob(otherUser._id, otherUpload._id);

      const response = await request(app)
        .get("/api/v1/jobs")
        .query({ page: 1, pageSize: 2 })
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.jobs).toHaveLength(2);
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

  describe("PATCH /api/v1/jobs/:jobId/cancel", () => {
    test("cancels a queued job and syncs the upload status", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "queued" });
      const job = await createTestJob(user._id, upload._id, {
        status: "queued",
      });

      const response = await request(app)
        .patch(`/api/v1/jobs/${job._id}/cancel`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("cancelled");

      const uploadResponse = await request(app)
        .get(`/api/v1/uploads/${upload._id}`)
        .set(authHeader(token));

      expect(uploadResponse.body.data.status).toBe("cancelled");
    });

    test("rejects cancelling an already-completed job", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "completed",
      });

      const response = await request(app)
        .patch(`/api/v1/jobs/${job._id}/cancel`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
    });

    test("only one of two concurrent cancel requests succeeds", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "queued" });
      const job = await createTestJob(user._id, upload._id, {
        status: "queued",
      });

      const [first, second] = await Promise.all([
        request(app)
          .patch(`/api/v1/jobs/${job._id}/cancel`)
          .set(authHeader(token)),
        request(app)
          .patch(`/api/v1/jobs/${job._id}/cancel`)
          .set(authHeader(token)),
      ]);

      const statuses = [first.status, second.status].sort();

      // One request wins (200), the other finds the job already
      // cancelled (400) - they can never both succeed.
      expect(statuses).toEqual([200, 400]);
    });
  });

  describe("POST /api/v1/jobs/:jobId/retry", () => {
    test("re-runs ingestion when no result rows exist yet", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "failed" });
      const job = await createTestJob(user._id, upload._id, {
        status: "failed",
      });

      const response = await request(app)
        .post(`/api/v1/jobs/${job._id}/retry`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("queued");

      const waitingJobs = await ingestionQueue.getJobs(["waiting", "delayed"]);
      const queuedForThisJob = waitingJobs.find(
        (queueJob) => queueJob.data.jobId === job._id.toString(),
      );

      expect(queuedForThisJob).toBeDefined();
    });

    test("re-runs processing when result rows already exist", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, {
        status: "completed_with_errors",
      });
      const job = await createTestJob(user._id, upload._id, {
        status: "completed_with_errors",
      });

      await createTestResults(job._id, [
        { status: "completed" },
        { status: "failed" },
      ]);

      const response = await request(app)
        .post(`/api/v1/jobs/${job._id}/retry`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe("queued");

      const waitingJobs = await processingQueue.getJobs([
        "waiting",
        "delayed",
      ]);
      const queuedForThisJob = waitingJobs.find(
        (queueJob) => queueJob.data.jobId === job._id.toString(),
      );

      expect(queuedForThisJob).toBeDefined();
    });

    test("only one of two concurrent retry requests succeeds", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "failed" });
      const job = await createTestJob(user._id, upload._id, {
        status: "failed",
      });

      const [first, second] = await Promise.all([
        request(app)
          .post(`/api/v1/jobs/${job._id}/retry`)
          .set(authHeader(token)),
        request(app)
          .post(`/api/v1/jobs/${job._id}/retry`)
          .set(authHeader(token)),
      ]);

      const statuses = [first.status, second.status].sort();

      expect(statuses).toEqual([200, 409]);

      // Only a single ingestion job should have been queued, no matter
      // how many retry requests raced for it.
      const waitingJobs = await ingestionQueue.getJobs(["waiting", "delayed"]);
      const queuedForThisJob = waitingJobs.filter(
        (queueJob) => queueJob.data.jobId === job._id.toString(),
      );

      expect(queuedForThisJob).toHaveLength(1);
    });

    test("rejects retrying a job that is not in a failed state", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id, { status: "queued" });
      const job = await createTestJob(user._id, upload._id, {
        status: "queued",
      });

      const response = await request(app)
        .post(`/api/v1/jobs/${job._id}/retry`)
        .set(authHeader(token));

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/v1/jobs/:jobId", () => {
    test("deletes a job owned by the user", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id, {
        status: "failed",
      });

      const response = await request(app)
        .delete(`/api/v1/jobs/${job._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const stillExists = await Job.findById(job._id);
      expect(stillExists).toBeNull();
    });

    test("rejects deleting another user's job", async () => {
      const { token } = await createTestUser();
      const { user: otherUser } = await createTestUser();
      const upload = await createTestUpload(otherUser._id);
      const job = await createTestJob(otherUser._id, upload._id);

      const response = await request(app)
        .delete(`/api/v1/jobs/${job._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
    });
  });
});
