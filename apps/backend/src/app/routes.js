const express = require("express");
const userRoutes = require("../modules/users/user.routes");
const authRoutes = require("../modules/auth/auth.routes");
const uploadRoutes = require("../modules/uploads/upload.routes");
const jobRoutes = require("../modules/jobs/job.routes");
const resultRoutes = require("../modules/results/result.routes");
const exportRoutes = require("../modules/exports/export.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");

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
router.use("/api/v1/jobs", jobRoutes);
router.use("/api/v1/results", resultRoutes);
router.use("/api/v1/exports", exportRoutes);
router.use("/api/v1/dashboard", dashboardRoutes);

module.exports = router;
