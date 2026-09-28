const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Generate Access Token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }
  );
};

// Generate Password Reset Token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash Token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

module.exports = {
  generateAccessToken,
  generatePasswordResetToken,
  hashToken,
};