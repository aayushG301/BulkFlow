const express = require("express");
const userRoutes = require("../modules/users/user.routes");
const cookieParser = require("cookie-parser");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/v1/users", userRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({success: true, message: "BulkFlow is Running Successfully"});
});

module.exports = app;