const { z } = require("zod");
const userRoles = require("../../constants/user.constants");

// Register
const validateRegisterUser = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),

  avatar: z
    .string()
    .trim()
    .url("Invalid avatar URL")
    .optional(),
});

// Login
const validateLoginUser = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

// Update profile
const validateUpdateUser = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),

  lastLogin: z
    .string()
    .trim()
    .optional(),

  avatar: z
    .string()
    .trim()
    .url("Invalid avatar URL")
    .optional(),
});

// Change password
const validateChangePassword = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),

  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password cannot exceed 128 characters"),
});

// Forgot password
const validateForgotPassword = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
});

// Reset password
const validateResetPassword = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),

  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "New password cannot exceed 128 characters"),
});

module.exports = {
  validateRegisterUser,
  validateLoginUser,
  validateUpdateUser,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
};