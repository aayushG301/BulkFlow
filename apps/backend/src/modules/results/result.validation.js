const { z } = require("zod");

const getResultSchema = z.object({
    resultId: z.string().trim().length(24, "Invalid result ID"),
});

const resultListQuerySchema = z.object({
    jobId: z.string().trim().length(24, "Invalid job ID").optional(),
    status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
});

const resultJobParamsSchema = z.object({
    jobId: z.string().trim().length(24, "Invalid job ID"),
});


module.exports = {
    getResultSchema,
    resultListQuerySchema,
    resultJobParamsSchema,
};