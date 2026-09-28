const Redis = require("ioredis");

const env = require("../config/env");

const createRedisConnection = () => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redis.on("error", (error) => {
    console.error("❌ Redis connection error:", error);
  });

  return redis;
};

module.exports = createRedisConnection;
