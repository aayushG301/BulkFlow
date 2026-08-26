const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const env = require("./config/env");
const app = require("./app/app");
const connectDB = require("./config/db");
const logger = require("./utils/logger.utils");

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    app.listen(env.PORT, () => {
      logger.info(`BulkFlow server is running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error.message,
      stack:
        process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });

    process.exit(1);
  }
};

startServer();