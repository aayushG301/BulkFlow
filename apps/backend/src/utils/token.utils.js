const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Generate Access Token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }
  );
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId }, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
  );
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET);
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
  generateRefreshToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  hashToken,
};