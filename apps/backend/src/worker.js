const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const connectDB = require("./config/db");

const startWorkers = async () => {
  try {
    await connectDB();

    require("./workers/ingestion.worker");
    require("./workers/processing.worker");
    require("./workers/export.worker");

    console.log("🚀 BulkFlow workers started");
  } catch (error) {
    console.error("❌ Failed to start workers:", error);
    process.exit(1);
  }
};

startWorkers();
