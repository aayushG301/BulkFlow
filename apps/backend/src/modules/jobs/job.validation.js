const { z } = require("zod");
const jobStatuses = require("../../constants/job.constants");

const createJobSchema = z.object({
  name: z.string().trim().min(1).max(100),
  uploadId: z.string().min(1),
  processingOptions: z.object({
    enrichmentEnabled: z.boolean(),
    enrichmentProvider: z.string().trim().min(1).nullable().optional(),
  }),
});

const updateJobSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  processingOptions: z.object({
      enrichmentEnabled: z.boolean().optional(),
      enrichmentProvider: z.string().trim().min(1).nullable().optional(),
    }).optional(),
});

const jobIdSchema = z.object({
  jobId: z.string().min(1),
});

const jobListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(jobStatuses).optional(),
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  jobIdSchema,
  jobListQuerySchema,
};