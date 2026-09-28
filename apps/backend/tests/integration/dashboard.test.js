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
  authHeader,
} = require("../helpers/factories");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

maybeDescribe("Dashboard API", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("requires authentication", async () => {
    const response = await request(app).get("/api/v1/dashboard");

    expect(response.status).toBe(401);
  });

  test("summarizes only the authenticated user's jobs", async () => {
    const { user, token } = await createTestUser();
    const { user: otherUser } = await createTestUser();

    const upload1 = await createTestUpload(user._id);
    await createTestJob(user._id, upload1._id, {
      status: "completed",
      processStats: {
        totalRows: 10,
        processedRows: 10,
        successfulRows: 8,
        failedRows: 2,
      },
    });

    const upload2 = await createTestUpload(user._id);
    await createTestJob(user._id, upload2._id, { status: "processing" });

    const otherUpload = await createTestUpload(otherUser._id);
    await createTestJob(otherUser._id, otherUpload._id, {
      status: "completed",
    });

    const response = await request(app)
      .get("/api/v1/dashboard")
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.data.summary.totalJobs).toBe(2);
    expect(response.body.data.summary.activeJobs).toBe(1);
    expect(response.body.data.summary.completedJobs).toBe(1);
    expect(response.body.data.processing.totalRows).toBe(10);
    expect(response.body.data.processing.remainingRows).toBe(0);
    expect(response.body.data.recentJobs).toHaveLength(2);
  });
});
