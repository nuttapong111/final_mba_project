import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default('your-secret-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.string().default('3001'),
  NODE_ENV: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.enum(['development', 'production', 'test']).default('development')),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Railway automatically sets PORT, but we use our own for consistency
  RAILWAY_ENVIRONMENT: z.string().optional(),
  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-southeast-1'),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_S3_PUBLIC_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);

