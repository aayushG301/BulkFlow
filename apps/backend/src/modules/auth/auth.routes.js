const express = require('express');
const router = express.Router();
const authMiddleware = require('./auth.middleware');
const authController = require('./auth.controller');

// Login User Route
router.post('/login', authMiddleware, authController.loginUser);

// Forgot Password Route
router.post('/forgot-password', authMiddleware, authController.forgotPassword);

// Reset Password Route
router.post('/reset-password', authMiddleware, authController.resetPassword);

// Refresh Token Route
router.post('/refresh-token', authMiddleware, authController.refreshToken);

// Logout User Route
router.post('/logout', authMiddleware, authController.logoutUser);

// Verify Email Route
router.post('/verify-email', authMiddleware, authController.verifyEmail);

// Resend Verification Email Route
router.post('/resend-verification-email', authMiddleware, authController.resendVerificationEmail);

module.exports = router;