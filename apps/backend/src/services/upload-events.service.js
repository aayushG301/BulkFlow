const { getIO } = require("../socket");

const emitUploadProgress = (uploadId, data = {}) => {
  try {
    getIO()
      .to(`upload:${uploadId}`)
      .emit("upload:progress", {
        uploadId,
        ...data,
      });
  } catch (error) {
    console.error("⚠️ Upload socket event failed:", error.message);
  }
};

module.exports = {
  emitUploadProgress,
};
