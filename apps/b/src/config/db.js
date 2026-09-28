const mongoose = require("mongoose");
const env = require("./env");
const logger = require("../utils/logger.utils");

async function connectDB() {
    try {
        await mongoose.connect(env.DB_URI);
        logger.info("Connected to database");
    } catch (error) {
        throw error;
    }
}

module.exports = connectDB;