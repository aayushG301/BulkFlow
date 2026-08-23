const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.DB_URI);
    }
    catch(error) {
        throw error;
    }
}

module.exports = connectDB;