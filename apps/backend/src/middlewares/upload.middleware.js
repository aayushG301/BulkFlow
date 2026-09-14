const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ----------------------------------------
// Upload Directory
// ----------------------------------------

const uploadDirectory = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

// ----------------------------------------
// Storage Configuration
// ----------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, uniqueName);
  },
});

// ----------------------------------------
// Allowed File Types
// ----------------------------------------

const allowedExtensions = [".csv"];

// ----------------------------------------
// File Filter
// ----------------------------------------

const fileFilter = (req, file, cb) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    const error = new Error(
      "Only CSV files are currently supported"
    );

    error.status = 400;

    return cb(error, false);
  }

  cb(null, true);
};

// ----------------------------------------
// Multer Configuration
// ----------------------------------------

const upload = multer({
  storage,

  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
    files: 1,
  },

  fileFilter,
});

// ----------------------------------------
// Single File Upload Middleware
// ----------------------------------------

const uploadSingleFile = upload.single("file");

// ----------------------------------------
// Export
// ----------------------------------------

module.exports = {
  uploadSingleFile,
};