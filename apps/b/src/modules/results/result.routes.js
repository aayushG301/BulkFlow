const express = require("express");

const resultController = require("./result.controller");
const authenticate = require("../../middlewares/auth.middleware");

const {
  resultJobParamsSchema,
  resultListQuerySchema,
  resultIdSchema,
} = require("./result.validation");

const validate = require("../../middlewares/validate.middleware");

const router = express.Router();

router.use(authenticate);

// Get all results for a job
router.get(
  "/jobs/:jobId",
  validate(resultJobParamsSchema, "params"),
  validate(resultListQuerySchema, "query"),
  resultController.getJobResults,
);

// Get failed results for a job
router.get(
  "/jobs/:jobId/failed",
  validate(resultJobParamsSchema, "params"),
  validate(resultListQuerySchema, "query"),
  resultController.getFailedResults,
);

// Get result statistics for a job
router.get(
  "/jobs/:jobId/stats",
  validate(resultJobParamsSchema, "params"),
  resultController.getResultStats,
);

// Get a single result
router.get(
  "/:resultId",
  validate(resultIdSchema, "params"),
  resultController.getResultById,
);

module.exports = router;
