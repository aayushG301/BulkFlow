const express = require("express");

const {
  createExportController,
  getExportController,
  getJobExportsController,
  downloadExportController,
} = require("./export.controller");

const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

// ----------------------------------------
// Create Export
// ----------------------------------------

router.post("/jobs/:jobId", authMiddleware, createExportController);

// ----------------------------------------
// Get All Exports For Job
// ----------------------------------------

router.get("/jobs/:jobId", authMiddleware, getJobExportsController);

// ----------------------------------------
// Download Export
// ----------------------------------------

router.get("/:exportId/download", authMiddleware, downloadExportController);

// ----------------------------------------
// Get Export
// ----------------------------------------

router.get("/:exportId", authMiddleware, getExportController);

module.exports = router;
