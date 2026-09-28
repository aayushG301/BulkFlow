const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env.test"),
  quiet: true,
});

// ----------------------------------------
// Check MongoDB Availability
// ----------------------------------------
// Integration tests need a real MongoDB to run against. Rather than
// letting every suite time out individually, we probe once here and
// flag the result through an env var (globalSetup runs before Jest
// forks its workers, so this value is inherited by every test file).
module.exports = async () => {
  const uri = process.env.DB_URI || "mongodb://127.0.0.1:27017/bulkflow_test";

  try {
    const connection = await mongoose
      .createConnection(uri, {
        serverSelectionTimeoutMS: 2000,
      })
      .asPromise();

    await connection.close();

    process.env.DB_AVAILABLE = "true";
  } catch (error) {
    process.env.DB_AVAILABLE = "false";

    console.warn(
      `\n⚠️  MongoDB is not reachable at ${uri} - DB-backed integration tests will be skipped.\n   (${error.message})\n   Start a local MongoDB (or update DB_URI in .env.test) to run the full suite.\n`,
    );
  }
};
