import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { HttpStatus } from '@/constants';

const jsonMessage = (message: string) => ({ success: false, message, data: null });

/** Global limiter applied to all API routes. */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  message: jsonMessage('Too many requests, please try again later.'),
});

/** Stricter limiter for auth endpoints (login, OTP, password reset). */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
  message: jsonMessage('Too many attempts, please slow down.'),
});
