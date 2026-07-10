import { z } from 'zod';

/**
 * Shared Zod schemas. Mirrors the backend express-validator rules so the same
 * shapes validate on both sides.
 */
export const contactSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9+\-\s()]{7,15}$/.test(v), 'Enter a valid phone number'),
  subject: z.string().max(150).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

/* ---- Auth ---- */
const password = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Needs an uppercase letter')
  .regex(/[0-9]/, 'Needs a number');

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  password,
});
export type SignupValues = z.infer<typeof signupSchema>;

export const otpSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code').regex(/^\d+$/, 'Digits only'),
});
export type OtpValues = z.infer<typeof otpSchema>;

export const forgotSchema = z.object({
  email: z.string().email('Enter a valid email'),
});
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetSchema = z.object({
  email: z.string().email('Enter a valid email'),
  code: z.string().length(6, 'Enter the 6-digit code'),
  newPassword: password,
});
export type ResetValues = z.infer<typeof resetSchema>;
