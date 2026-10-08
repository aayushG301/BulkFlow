const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  DB_URI: z
    .string()
    .min(1, "DB_URI is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_EXPIRES_IN: z
    .string()
    .default("15m"),

  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),

  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .default("14d"),

  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

    REDIS_URL: z
    .string()
    .min(1, "REDIS_URL is required"),

  // Optional on purpose: enrichment falls back to the mock provider
  // when this isn't set, rather than failing to boot.
  GEMINI_API_KEY: z
    .string()
    .trim()
    .optional(),

  GEMINI_MODEL: z
    .string()
    .trim()
    .default("gemini-1.5-flash"),
   });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");

  console.error(
    parsedEnv.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
  );

  process.exit(1);
}

const env = parsedEnv.data;

module.exports = env;