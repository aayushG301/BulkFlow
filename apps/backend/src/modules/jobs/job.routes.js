const express = require("express");
const router = express.Router();
const jobController = require("./job.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Create a new job
router.post("/", authMiddleware, jobController.createJob);

// Get job by ID
router.get("/:jobId", authMiddleware, jobController.getJob);

// Get all jobs for the user
router.get("/", authMiddleware, jobController.getJobs);

// Update job
router.patch("/:jobId", authMiddleware, jobController.updateJob);

// Cancel job
router.patch("/:jobId/cancel", authMiddleware, jobController.cancelJob);

// Delete job
router.delete("/:jobId", authMiddleware, jobController.deleteJob);

// Retry job
router.post("/:jobId/retry", authMiddleware, jobController.retryJob);

module.exports = router;    