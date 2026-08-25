const { z } = require("zod");

const validateLogin = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password cannot exceed 128 characters"),
});

const validateForgotPassword = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
});

const validateResetPassword = z.object({
    token: z.string().trim().min(1, "Token is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(128, "New password cannot exceed 128 characters"),
});

const validateVerifyEmail = z.object({
    token: z.string().trim().min(1, "Token is required"),
});

const validateRefreshToken = z.object({
    refreshToken: z.string().trim().min(1, "Refresh token is required"),
});

module.exports = {
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateVerifyEmail,
    validateRefreshToken,
}
