const uploadService = require("./upload.service");
const {uploadConfigurationSchema} = require("./upload.validation");

// Create Upload
const createUpload = async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    if (!req.file) {
      const error = new Error("Upload file is required");
      error.status = 400;
      throw error;
    }
    const validatedData = uploadConfigurationSchema.parse(req.body);
    const upload = await uploadService.createUpload(authenticatedUser._id, req.file, validatedData);
    return res.status(201).json({
      success: true,
      message: "Upload created successfully",
      data: upload,
    });
  } catch (error) {
    next(error);
  }
};

// Get Upload
const getUpload = async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    const upload = await uploadService.getUploadById(req.params.uploadId, authenticatedUser._id);
    return res.status(200).json({
      success: true,
      message: "Upload retrieved successfully",
      data: upload,
    });
  } catch (error) {
    next(error);
  }
};

// Get User Uploads
const getUploads = async (req, res, next) => {
  try {
    const authenticatedUser = req.user;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const status = req.query.status || undefined;
    const uploads = await uploadService.getUserUploads(authenticatedUser._id, page, limit, status);
    return res.status(200).json({
      success: true,
      message: "Uploads retrieved successfully",
      data: uploads,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Upload
const cancelUpload = async (req, res, next) => {
  try {
    const upload = await uploadService.cancelUpload(req.params.uploadId, req.user._id);
    return res.status(200).json({
      success: true,
      message: "Upload cancelled successfully",
      data: upload,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Upload
const deleteUpload = async (req, res, next) => {
  try {
    await uploadService.deleteUpload(req.params.uploadId, req.user._id);
    return res.status(200).json({
      success: true,
      message: "Upload deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Retry Upload
const retryUpload = async (req, res, next) => {
  try {
    const upload = await uploadService.retryUpload(req.params.uploadId, req.user._id);
    return res.status(200).json({
      success: true,
      message: "Upload queued for retry successfully",
      data: upload,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUpload,
  getUpload,
  getUploads,
  cancelUpload,
  deleteUpload,
  retryUpload,
};