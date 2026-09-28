const exportService = require("./export.service");

const createExport = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { format = "csv" } = req.body;

    const exportRecord = await exportService.createExport({
      jobId,
      userId: req.user.id,
      format,
    });

    return res.status(202).json({
      success: true,
      message: "Export queued successfully",
      data: exportRecord,
    });
  } catch (error) {
    next(error);
  }
};

const getExport = async (req, res, next) => {
  try {
    const exportRecord = await exportService.getExportById({
      exportId: req.params.exportId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Export retrieved successfully",
      data: exportRecord,
    });
  } catch (error) {
    next(error);
  }
};

const getJobExports = async (req, res, next) => {
  try {
    const exports = await exportService.getExportsByJob({
      jobId: req.params.jobId,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Exports retrieved successfully",
      data: exports,
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// Download Export
// ----------------------------------------
// Authenticated, ownership-checked, streamed file download. The file
// path served here always comes from exportService (never straight
// from the request), so it cannot be used to read arbitrary files.
const downloadExport = async (req, res, next) => {
  try {
    const file = await exportService.getExportFileForDownload({
      exportId: req.params.exportId,
      userId: req.user.id,
    });

    return res.download(file.filePath, file.fileName, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExport,
  getExport,
  getJobExports,
  downloadExport,
};
