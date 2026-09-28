const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { ZodError } = require("zod");
const logger = require("../utils/logger.utils");

// Global Error Handler
const errorMiddleware = (error, req, res, next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors = undefined;

  // Log the actual error for developers
  logger.error(error.message || "Unknown error", {
    method: req.method,
    url: req.originalUrl,
    statusCode: error.status || 500,
    stack: process.env.NODE_ENV !== "production"? error.stack : undefined,
  });

  // Custom Application Error
  if (error.status) {
    statusCode = error.status;
    message = error.message || message;
  }

  // Zod Validation Error
  else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  }

  // Mongoose Validation Error
  else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
  }

  // Mongoose Cast Error
  else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  }

  // MongoDB Duplicate Key Error
  else if (error.code === 11000) {
    statusCode = 409;

    const fields = Object.keys(error.keyPattern || {});

    if (fields.length > 0) {
      message = `${fields.join(", ")} already exists`;
    } else {
      message = "Duplicate value already exists";
    }
  }

  // JWT Errors
  else if (error instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  else if (error instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  else if (error instanceof jwt.NotBeforeError) {
    statusCode = 401;
    message = "Authentication token is not active";
  }

  // JSON Body Parsing Error
  else if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    error.type === "entity.parse.failed"
  ) {
    statusCode = 400;
    message = "Invalid JSON payload";
  }

  // Payload Too Large
  else if (
    error.type === "entity.too.large" ||
    error.status === 413
  ) {
    statusCode = 413;
    message = "Request payload is too large";
  }

  // Final Response
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }

  // Only expose detailed error information outside production
  if (process.env.NODE_ENV !== "production" && !errors) {
    response.error = error.name;
  }
  return res.status(statusCode).json(response);
};

module.exports = errorMiddleware;