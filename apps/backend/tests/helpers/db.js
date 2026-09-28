const mongoose = require("mongoose");

// Whether a real MongoDB is reachable, decided once by globalSetup.js
const isDbAvailable = () => process.env.DB_AVAILABLE === "true";

// Connect To Test Database
const connectTestDB = async () => {
  if (!isDbAvailable()) {
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  await mongoose.connect(process.env.DB_URI, {
    serverSelectionTimeoutMS: 2000,
  });

  return true;
};

// Disconnect From Test Database
const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

// Clear All Collections Between Tests
const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
};

// Close Queue Connections (BullMQ/ioredis)
// Prevents the queue-backed integration suites from leaving the Redis
// connections open once their tests finish.
const closeQueueConnections = async () => {
  try {
    const { ingestionQueue } = require("../../src/queues/ingestion.queue");
    const { processingQueue } = require("../../src/queues/processing.queue");
    const { exportQueue } = require("../../src/queues/export.queue");

    await Promise.all([
      ingestionQueue.close(),
      processingQueue.close(),
      exportQueue.close(),
    ]);
  } catch (error) {
    // Queues may not have been required by every suite - nothing to close
  }
};

module.exports = {
  isDbAvailable,
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  closeQueueConnections,
};
