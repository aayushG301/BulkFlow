const express = require('express');
const router = express.Router();
const uploadController = require('./upload.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { uploadSingleFile } = require('../../middlewares/upload.middleware');

// Create upload
router.post("/", authMiddleware, uploadSingleFile, uploadController.createUpload);

// Get uploads
router.get("/", authMiddleware, uploadController.getUploads);

// Get upload
router.get("/:uploadId", authMiddleware, uploadController.getUpload);

// Cancel upload
router.patch("/:uploadId/cancel", authMiddleware, uploadController.cancelUpload);

// Delete upload
router.delete("/:uploadId", authMiddleware, uploadController.deleteUpload);

// Retry upload
router.patch("/:uploadId/retry", authMiddleware, uploadController.retryUpload);

module.exports = router;
