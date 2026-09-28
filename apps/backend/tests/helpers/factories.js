const app = require("../../src/app/app");

const User = require("../../src/modules/users/user.model");
const Upload = require("../../src/modules/uploads/upload.model");
const Job = require("../../src/modules/jobs/job.model");
const Result = require("../../src/modules/results/result.model");

const { hashPassword } = require("../../src/utils/password.utils");
const { generateAccessToken } = require("../../src/utils/token.utils");

let userCounter = 0;

// Create Test User (+ ready-to-use auth token)
const createTestUser = async (overrides = {}) => {
  userCounter += 1;

  const password = overrides.password || "Password123!";

  const user = await User.create({
    name: overrides.name || `Test User ${userCounter}`,
    email:
      overrides.email || `test-user-${userCounter}-${Date.now()}@example.com`,
    password: await hashPassword(password),
    isActive: overrides.isActive ?? true,
  });

  const token = generateAccessToken(user._id);

  return { user, token, password };
};

// Create Test Upload
const createTestUpload = async (userId, overrides = {}) => {
  return Upload.create({
    userId,
    file: {
      originalName: overrides.originalName || "sample.csv",
      storedName: overrides.storedName || "stored-sample.csv",
      storageKey: overrides.storageKey || "/tmp/stored-sample.csv",
      size: overrides.size ?? 100,
      mimeType: overrides.mimeType || "text/csv",
    },
    configuration: overrides.configuration || {},
    status: overrides.status || "queued",
  });
};

// Create Test Job
const createTestJob = async (userId, uploadId, overrides = {}) => {
  return Job.create({
    name: overrides.name || "Test job",
    userId,
    uploadId,
    status: overrides.status || "queued",
    processStats: overrides.processStats || undefined,
    processingOptions: overrides.processingOptions || {},
  });
};

// Create Test Results (bulk)
const createTestResults = async (jobId, rows) => {
  return Result.insertMany(
    rows.map((row, index) => ({
      jobId,
      rowNum: index + 1,
      originalData: row.originalData || { value: index },
      processedData: row.processedData ?? null,
      status: row.status || "pending",
      error: row.error || { message: null, code: null },
    })),
  );
};

// Authorization Header Helper
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = {
  app,
  createTestUser,
  createTestUpload,
  createTestJob,
  createTestResults,
  authHeader,
};
