const request = require("supertest");

const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
} = require("../helpers/db");

const { app, createTestUser, authHeader } = require("../helpers/factories");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

maybeDescribe("Users API", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /api/v1/users", () => {
    test("registers a new user", async () => {
      const response = await request(app).post("/api/v1/users").send({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("ada@example.com");
      expect(response.body.data.password).toBeUndefined();
    });

    test("rejects a duplicate email", async () => {
      await createTestUser({ email: "duplicate@example.com" });

      const response = await request(app).post("/api/v1/users").send({
        name: "Someone Else",
        email: "duplicate@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test("rejects an invalid payload", async () => {
      const response = await request(app).post("/api/v1/users").send({
        name: "A",
        email: "not-an-email",
        password: "short",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/users/me", () => {
    test("requires authentication", async () => {
      const response = await request(app).get("/api/v1/users/me");

      expect(response.status).toBe(401);
    });

    test("returns the authenticated user's profile", async () => {
      const { user, token } = await createTestUser();

      const response = await request(app)
        .get("/api/v1/users/me")
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(user.email);
    });
  });

  describe("PATCH /api/v1/users/me", () => {
    test("updates the authenticated user's name", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .patch("/api/v1/users/me")
        .set(authHeader(token))
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe("Updated Name");
    });
  });

  describe("PATCH /api/v1/users/me/password", () => {
    test("changes the password when the current password is correct", async () => {
      const { token, password } = await createTestUser();

      const response = await request(app)
        .patch("/api/v1/users/me/password")
        .set(authHeader(token))
        .send({ currentPassword: password, newPassword: "NewPassword123!" });

      expect(response.status).toBe(200);
    });

    test("rejects an incorrect current password", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .patch("/api/v1/users/me/password")
        .set(authHeader(token))
        .send({ currentPassword: "wrong", newPassword: "NewPassword123!" });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/users/me", () => {
    test("deactivates the authenticated user's account", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .delete("/api/v1/users/me")
        .set(authHeader(token));

      expect(response.status).toBe(200);

      // The account is now inactive, so the same token should be rejected
      const followUp = await request(app)
        .get("/api/v1/users/me")
        .set(authHeader(token));

      expect(followUp.status).toBe(403);
    });
  });
});
