const request = require("supertest");

const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
} = require("../helpers/db");

const { app, createTestUser, authHeader } = require("../helpers/factories");

const User = require("../../src/modules/users/user.model");
const { hashToken } = require("../../src/utils/token.utils");

const dbAvailable = process.env.DB_AVAILABLE === "true";
const maybeDescribe = dbAvailable ? describe : describe.skip;

maybeDescribe("Auth API", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  describe("POST /api/v1/auth/login", () => {
    test("logs in with correct credentials", async () => {
      const { user, password } = await createTestUser({
        email: "login-user@example.com",
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "login-user@example.com",
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toEqual(expect.any(String));
      expect(response.body.data.refreshToken).toEqual(expect.any(String));
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.refreshToken).toBeUndefined();
    });

    test("rejects an incorrect password", async () => {
      await createTestUser({ email: "wrong-password@example.com" });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: "wrong-password@example.com",
        password: "not-the-right-password",
      });

      expect(response.status).toBe(401);
    });

    test("rejects an unknown email", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "does-not-exist@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(404);
    });

    test("rejects login for a deactivated account", async () => {
      const { user, password } = await createTestUser({
        email: "inactive-user@example.com",
        isActive: false,
      });

      const response = await request(app).post("/api/v1/auth/login").send({
        email: user.email,
        password,
      });

      expect(response.status).toBe(403);
    });

    test("rejects an invalid payload", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "not-an-email",
        password: "",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    const login = (email, password) =>
      request(app).post("/api/v1/auth/login").send({ email, password });

    test("is reachable without an access token (it exists for when one has expired)", async () => {
      const { password } = await createTestUser({
        email: "refresh-user@example.com",
      });

      const loginResponse = await login("refresh-user@example.com", password);

      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken: loginResponse.body.data.refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toEqual(expect.any(String));
    });

    test("rejects a refresh token that was already revoked by logout", async () => {
      const { password } = await createTestUser({
        email: "revoked-user@example.com",
      });

      const loginResponse = await login(
        "revoked-user@example.com",
        password,
      );
      const { accessToken, refreshToken } = loginResponse.body.data;

      await request(app)
        .post("/api/v1/auth/logout")
        .set(authHeader(accessToken));

      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken });

      expect(response.status).toBe(401);
    });

    test("rejects a malformed refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh-token")
        .send({ refreshToken: "not-a-real-token" });

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    test("requires authentication", async () => {
      const response = await request(app).post("/api/v1/auth/logout");

      expect(response.status).toBe(401);
    });

    test("clears the stored refresh token", async () => {
      const { user, token } = await createTestUser();

      await User.findByIdAndUpdate(user._id, { refreshToken: "some-hash" });

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set(authHeader(token));

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.refreshToken).toBeNull();
    });
  });

  describe("POST /api/v1/auth/forgot-password + reset-password", () => {
    test("is reachable without an access token", async () => {
      const { user } = await createTestUser({
        email: "forgot-user@example.com",
      });

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: user.email });

      expect(response.status).toBe(200);
      expect(response.body.data.resetToken).toEqual(expect.any(String));
    });

    test("does not reveal whether an email exists", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "unknown@example.com" });

      expect(response.status).toBe(200);
      expect(response.body.data.resetToken).toBeUndefined();
    });

    test("resets the password with a valid token and revokes old sessions", async () => {
      const { user, password } = await createTestUser({
        email: "reset-user@example.com",
      });

      const forgotResponse = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: user.email });

      const { resetToken } = forgotResponse.body.data;

      const resetResponse = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ token: resetToken, newPassword: "BrandNewPassword123!" });

      expect(resetResponse.status).toBe(200);

      // Old password no longer works
      const oldLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: user.email, password });
      expect(oldLogin.status).toBe(401);

      // New password works
      const newLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: user.email, password: "BrandNewPassword123!" });
      expect(newLogin.status).toBe(200);
    });

    test("rejects an invalid or expired reset token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ token: "not-a-real-token", newPassword: "SomethingNew123!" });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/verify-email + resend-verification-email", () => {
    test("resend-verification-email is reachable without an access token", async () => {
      const { user } = await createTestUser();

      const response = await request(app)
        .post("/api/v1/auth/resend-verification-email")
        .send({ email: user.email });

      expect(response.status).toBe(200);
      expect(response.body.data.verificationToken).toEqual(
        expect.any(String),
      );
    });

    test("the full resend -> verify loop actually completes", async () => {
      const { user } = await createTestUser();

      const resendResponse = await request(app)
        .post("/api/v1/auth/resend-verification-email")
        .send({ email: user.email });

      const { verificationToken } = resendResponse.body.data;

      const verifyResponse = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: verificationToken });

      expect(verifyResponse.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isEmailVerified).toBe(true);
    });

    test("verifies the email with a valid token", async () => {
      const { user } = await createTestUser();

      const verificationToken = "raw-verification-token";

      await User.findByIdAndUpdate(user._id, {
        verificationToken: hashToken(verificationToken),
        verificationExpires: new Date(Date.now() + 60 * 1000),
      });

      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: verificationToken });

      expect(response.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isEmailVerified).toBe(true);
      expect(updatedUser.verificationToken).toBeNull();
    });

    test("rejects an invalid or expired verification token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: "not-a-real-token" });

      expect(response.status).toBe(400);
    });
  });
});

