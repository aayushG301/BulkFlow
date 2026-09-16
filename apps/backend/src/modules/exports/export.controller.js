const fs = require("fs");

const {
  createExport,
  getExportById,
  getExportsByJob,
} = require("./export.service");

// ----------------------------------------
// Create Export
// ----------------------------------------

const createExportController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { jobId } = req.params;
    const { format = "csv" } = req.body;

    const exportRecord = await createExport({
      jobId,
      userId,
      format,
    });

    res.status(202).json({
      success: true,
      message: "Export job queued successfully",
      data: exportRecord,
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// Get Export
// ----------------------------------------

const getExportController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { exportId } = req.params;

    const exportRecord = await getExportById({
      exportId,
      userId,
    });

    res.status(200).json({
      success: true,
      data: exportRecord,
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// Get Job Exports
// ----------------------------------------

const getJobExportsController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { jobId } = req.params;

    const exports = await getExportsByJob({
      jobId,
      userId,
    });

    res.status(200).json({
      success: true,
      data: exports,
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// Download Export
// ----------------------------------------

const downloadExportController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { exportId } = req.params;

    const exportRecord = await getExportById({
      exportId,
      userId,
    });

    if (exportRecord.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Export is not ready for download",
      });
    }

    if (!exportRecord.filePath) {
      return res.status(404).json({
        success: false,
        message: "Export file not found",
      });
    }

    if (!fs.existsSync(exportRecord.filePath)) {
      return res.status(404).json({
        success: false,
        message: "Export file no longer exists",
      });
    }

    return res.download(exportRecord.filePath, exportRecord.fileName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExportController,
  getExportController,
  getJobExportsController,
  downloadExportController,
};
