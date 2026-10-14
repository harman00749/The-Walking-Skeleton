import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters."),
  JWT_EXPIRES_IN: z.string().default("1d"),
  GEMINI_API_KEY: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().min(10, "GEMINI_API_KEY is invalid.").optional(),
  ),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  STRIPE_SECRET_KEY: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().startsWith("sk_test_", "STRIPE_SECRET_KEY must be a Stripe Test Mode secret key.").optional(),
  ),
});

export type Environment = z.infer<typeof envSchema>;

export function getEnv(): Environment {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}

