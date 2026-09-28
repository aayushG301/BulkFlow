const express = require("express");

const authMiddleware = require("../../middlewares/auth.middleware");
const controller = require("./export.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/jobs/:jobId", controller.createExport);

router.get("/jobs/:jobId", controller.getJobExports);

router.get("/:exportId", controller.getExport);

module.exports = router;
