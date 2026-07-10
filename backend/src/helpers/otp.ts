import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

/** Generate a cryptographically-random 6-digit OTP. */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/** Hash an OTP before storing (never store plaintext). */
export function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export function compareOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/** Expiry timestamp for a freshly generated OTP. */
export function otpExpiry(): Date {
  return new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
}
