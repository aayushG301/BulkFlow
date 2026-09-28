const { z } = require("zod");

// Constants
const allowedMimeTypes = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const allowedExtensions = [".csv", ".xls", ".xlsx"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const enrichmentProviders = ["gemini"];

// File Validation
const uploadFileSchema = z.object({
  originalname: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name cannot exceed 255 characters"),
  mimetype: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => allowedMimeTypes.includes(value),
      "Only CSV, XLS, and XLSX files are allowed"
    ),
  size: z
    .number()
    .positive("File cannot be empty")
    .max(MAX_FILE_SIZE, "File size cannot exceed 25 MB"),
});

// Upload Configuration Validation
const uploadConfigurationSchema = z
  .object({
    enrichmentEnabled: z
      .enum(["true", "false"])
      .transform((value) => value === "true"),

    enrichmentProvider: z
      .enum(enrichmentProviders)
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Provider required when enrichment enabled
    if (data.enrichmentEnabled && !data.enrichmentProvider) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["enrichmentProvider"],
        message: "Enrichment provider is required when enrichment is enabled",
      });
    }

    // Provider should not be supplied when enrichment is disabled
    if (!data.enrichmentEnabled && data.enrichmentProvider) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["enrichmentProvider"],
        message: "Enrichment provider should not be provided when enrichment is disabled",
      });
    }
  });

// Upload Request Validation
const createUploadSchema = z.object({
  body: uploadConfigurationSchema,
  file: uploadFileSchema,
});

// Helpers
const getFileExtension = (filename) => {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return "";
  }
  return filename
    .slice(lastDotIndex)
    .toLowerCase();
};

// Validate File Extension
const validateUploadFile = (file) => {
  const result = uploadFileSchema.safeParse(file);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
  }

  const extension = getFileExtension(file.originalname);
  if (!allowedExtensions.includes(extension)) {
    return {
      success: false,
      errors: [{
          field: "originalname",
          message: "Only CSV, XLS, and XLSX files are allowed",
        }],
    };
  }
  return {
    success: true,
    data: result.data,
  };
};

module.exports = {
  uploadFileSchema,
  uploadConfigurationSchema,
  createUploadSchema,
  validateUploadFile,
  allowedMimeTypes,
  allowedExtensions,
  MAX_FILE_SIZE,
  enrichmentProviders,
};