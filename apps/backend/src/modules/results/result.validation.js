const { z } = require("zod");

// Job ID params
const resultJobParamsSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

// Result ID params
const resultIdSchema = z.object({
  resultId: z.string().min(1, "Result ID is required"),
});

// Result list query
const resultListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
});

// Update result
const updateResultSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),

  processedData: z.record(z.any()).optional(),

  enrichmentData: z.any().optional(),

  error: z
    .object({
      message: z.string().nullable().optional(),
      code: z.string().nullable().optional(),
    })
    .optional(),
});

module.exports = {
  resultJobParamsSchema,
  resultIdSchema,
  resultListQuerySchema,
  updateResultSchema,
};
