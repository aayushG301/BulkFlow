const request = require("supertest");

const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
} = require("../helpers/db");

const {
  app,
  createTestUser,
  createTestUpload,
  createTestJob,
  createTestResults,
  authHeader,
} = require("../helpers/factories");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

maybeDescribe("Results API", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("GET /api/v1/results/jobs/:jobId", () => {
    test("returns paginated results for the owner", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id);

      await createTestResults(
        job._id,
        Array.from({ length: 5 }, (_, index) => ({
          status: index % 2 === 0 ? "completed" : "failed",
        })),
      );

      const response = await request(app)
        .get(`/api/v1/results/jobs/${job._id}`)
        .query({ page: 1, pageSize: 2 })
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(5);
    });

    test("returns 404 when the job belongs to another user", async () => {
      const { token } = await createTestUser();
      const { user: otherUser } = await createTestUser();
      const upload = await createTestUpload(otherUser._id);
      const job = await createTestJob(otherUser._id, upload._id);

      await createTestResults(job._id, [{ status: "completed" }]);

      const response = await request(app)
        .get(`/api/v1/results/jobs/${job._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/results/jobs/:jobId/failed", () => {
    test("only returns failed rows", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id);

      await createTestResults(job._id, [
        { status: "completed" },
        { status: "failed" },
        { status: "failed" },
      ]);

      const response = await request(app)
        .get(`/api/v1/results/jobs/${job._id}/failed`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.results).toHaveLength(2);
      expect(
        response.body.data.results.every((result) => result.status === "failed"),
      ).toBe(true);
    });
  });

  describe("GET /api/v1/results/jobs/:jobId/stats", () => {
    test("returns 404 for a job that is not the caller's", async () => {
      const { token } = await createTestUser();
      const { user: otherUser } = await createTestUser();
      const upload = await createTestUpload(otherUser._id);
      const job = await createTestJob(otherUser._id, upload._id);

      const response = await request(app)
        .get(`/api/v1/results/jobs/${job._id}/stats`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/results/:resultId", () => {
    test("returns a result the caller's job owns", async () => {
      const { user, token } = await createTestUser();
      const upload = await createTestUpload(user._id);
      const job = await createTestJob(user._id, upload._id);

      const [result] = await createTestResults(job._id, [
        { status: "completed" },
      ]);

      const response = await request(app)
        .get(`/api/v1/results/${result._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(result._id.toString());
    });

    test("returns 404 for a result belonging to another user's job", async () => {
      const { token } = await createTestUser();
      const { user: otherUser } = await createTestUser();
      const upload = await createTestUpload(otherUser._id);
      const job = await createTestJob(otherUser._id, upload._id);

      const [result] = await createTestResults(job._id, [
        { status: "completed" },
      ]);

      // This is the IDOR this hardening pass closed: fetching a result
      // by ID must not leak another user's data.
      const response = await request(app)
        .get(`/api/v1/results/${result._id}`)
        .set(authHeader(token));

      expect(response.status).toBe(404);
    });
  });
});
