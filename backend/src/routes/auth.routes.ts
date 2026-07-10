import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { authValidation } from '@/validations/auth.validation';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/auth';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

// Public auth flows (rate-limited)
router.post('/signup', authRateLimiter, validate(authValidation.signup), asyncHandler(authController.signup));
router.post('/verify-signup', authRateLimiter, validate(authValidation.verifySignup), asyncHandler(authController.verifySignup));
router.post('/login', authRateLimiter, validate(authValidation.login), asyncHandler(authController.login));
router.post('/verify-login', authRateLimiter, validate(authValidation.verifyLogin), asyncHandler(authController.verifyLogin));
router.post('/resend-otp', authRateLimiter, validate(authValidation.resendOtp), asyncHandler(authController.resendOtp));
router.post('/forgot-password', authRateLimiter, validate(authValidation.forgotPassword), asyncHandler(authController.forgotPassword));
router.post('/reset-password', authRateLimiter, validate(authValidation.resetPassword), asyncHandler(authController.resetPassword));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', asyncHandler(authController.logout));

// Authenticated
router.get('/me', authenticate, asyncHandler(authController.me));
router.post('/change-password', authenticate, validate(authValidation.changePassword), asyncHandler(authController.changePassword));

export { router as authRoutes };
