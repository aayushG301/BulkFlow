const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// Generate Access Token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN }
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