const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const routes = require("./routes");
const errorMiddleware = require("../middlewares/error.middleware");

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,  
}));
app.use(express.json({limit: "10kb"}));
app.use(cookieParser());

// API Routes
app.use(routes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;