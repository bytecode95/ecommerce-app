import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

const environment = process.env.NODE_ENV || 'development';

const envFile = path.resolve(
    process.cwd(),
    `config/env/${environment}.env`,
);

dotenv.config({
    path: envFile,
});

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),

    PORT: z.coerce
        .number()
        .int()
        .positive()
        .default(4000),

    // Database
    DB_HOST: z.string().min(1),
    DB_PORT: z.coerce.number().int().positive().default(3306),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string().min(1),
    DB_CONNECTION_LIMIT: z.coerce
        .number()
        .int()
        .positive()
        .default(10),
    // JWT
    JWT_ACCESS_SECRET: z.string().min(
        32,
        'JWT_ACCESS_SECRET must be at least 32 characters',
    ),

    JWT_REFRESH_SECRET: z.string().min(
        32,
        'JWT_REFRESH_SECRET must be at least 32 characters',
    ),

    JWT_ACCESS_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(15 * 60),

    JWT_REFRESH_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(30 * 24 * 60 * 60),
    // OTP
    OTP_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(5 * 60),

    OTP_MAX_ATTEMPTS: z.coerce
        .number()
        .int()
        .positive()
        .default(5),

    OTP_RESEND_COOLDOWN_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(60),
    CORS_ORIGIN: z
        .string()
        .default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment configuration:');

        for (const issue of parsed.error.issues) {
            console.error(
                `  - ${issue.path.join('.')}: ${issue.message}`,
            );
        }

        process.exit(1);
    }

    return parsed.data;
}

export const env = loadEnv();

export const isProduction =
    env.NODE_ENV === 'production';