const express = require("express");
const userRoutes = require("../modules/users/user.routes");
const authRoutes = require("../modules/auth/auth.routes");
const uploadRoutes = require("../modules/uploads/upload.routes");
const router = express.Router();

// Health Check
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "BulkFlow is running successfully",
  });
});

// API Routes
router.use("/api/v1/users", userRoutes);
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/uploads", uploadRoutes);

module.exports = router;