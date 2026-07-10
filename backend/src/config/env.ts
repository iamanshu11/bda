import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Validate and type all environment variables at boot.
 * The app crashes early with a clear message if config is missing/invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  OTP_EXPIRY_MINUTES: z.coerce.number().default(5),
  OTP_RESEND_SECONDS: z.coerce.number().default(60),

  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM_NAME: z.string().default('Bokaro Defence Academy'),
  MAIL_FROM_ADDRESS: z.string().default('no-reply@bokarodefenceacademy.com'),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  UPLOAD_DIR: z.string().default('src/uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  // ---- Razorpay (test or live) ----
  RAZORPAY_KEY_ID: z
    .string()
    .default('')
    .transform((v) => v.trim()),
  RAZORPAY_KEY_SECRET: z
    .string()
    .default('')
    .transform((v) => v.trim()),
  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .default('')
    .transform((v) => v.trim()),

  SEED_SUPERADMIN_EMAIL: z.string().email().default('admin@bokarodefenceacademy.com'),
  SEED_SUPERADMIN_PASSWORD: z.string().default('Admin@12345'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
