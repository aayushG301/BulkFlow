const { z } = require("zod");

const jobIdSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
});

const createJobSchema = z.object({
  uploadId: z.string().min(1, "Upload ID is required"),
  name: z.string().min(1).max(100),
  processingOptions: z
    .object({
      enrichmentEnabled: z.boolean().default(false),
      enrichmentProvider: z.string().nullable().optional(),
    })
    .default({}),
});

const updateJobSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  processingOptions: z
    .object({
      enrichmentEnabled: z.boolean().optional(),
      enrichmentProvider: z.string().nullable().optional(),
    })
    .optional(),
});

const jobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "queued",
      "processing",
      "completed",
      "completed_with_errors",
      "failed",
      "cancelled",
    ])
    .optional(),
});

module.exports = {
  jobIdSchema,
  createJobSchema,
  updateJobSchema,
  jobListQuerySchema,
};