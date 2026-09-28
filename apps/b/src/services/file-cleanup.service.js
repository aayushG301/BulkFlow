const fs = require("fs");

// ----------------------------------------
// Delete File
// ----------------------------------------

const deleteFile = async (filePath) => {
  if (!filePath) {
    return false;
  }

  try {
    await fs.promises.unlink(filePath);

    console.log(`🗑️ File deleted: ${filePath}`);

    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    console.error(`❌ Failed to delete file: ${filePath}`, error.message);

    return false;
  }
};

// ----------------------------------------
// Check File Exists
// ----------------------------------------

const fileExists = async (filePath) => {
  if (!filePath) {
    return false;
  }

  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  deleteFile,
  fileExists,
};
