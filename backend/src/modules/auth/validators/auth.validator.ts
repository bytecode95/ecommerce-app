import { z } from 'zod';
export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')

export const emailSchema = z.string()
    .trim()
    .toLowerCase()
    .pipe(z.email());

export const phoneSchema = z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format, e.g. +14155551234');

export const registerSchema = z.object({
    name: z.string().trim().min(1).max(255),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;