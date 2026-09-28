const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authController = require('./auth.controller');

// Login User Route
router.post('/login', authController.loginUser);

// Forgot Password Route (public - a logged-out user needs this)
router.post('/forgot-password', authController.forgotPassword);

// Reset Password Route (public - a logged-out user needs this)
router.post('/reset-password', authController.resetPassword);

// Refresh Token Route (public - used precisely when the access token
// has already expired, so it cannot require authMiddleware)
router.post('/refresh-token', authController.refreshToken);

// Logout User Route (requires a valid access token)
router.post('/logout', authMiddleware, authController.logoutUser);

// Verify Email Route (public - a not-yet-verified user needs this)
router.post('/verify-email', authController.verifyEmail);

// Resend Verification Email Route (public - same reason as above)
router.post('/resend-verification-email', authController.resendVerificationEmail);

module.exports = router;
