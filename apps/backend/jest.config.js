module.exports = {
  testEnvironment: "node",

  // Loads env vars before the test framework boots
  setupFiles: ["<rootDir>/tests/setup/env.js"],

  // Runs once, before any test file, to check whether a real MongoDB
  // is reachable. DB-backed suites skip themselves when it is not.
  globalSetup: "<rootDir>/tests/setup/globalSetup.js",

  testMatch: ["**/tests/**/*.test.js"],

  testTimeout: 20000,

  verbose: true,
};
