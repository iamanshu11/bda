import type { Request, Response } from 'express';
import { authService } from '@/services/auth.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { HttpStatus, COOKIE_NAMES, OtpPurpose } from '@/constants';
import { isProd } from '@/config/env';
import type { AuthenticatedRequest } from '@/interfaces';

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const meta = (req: Request) => ({ userAgent: req.get('user-agent') ?? undefined, ipAddress: req.ip });

export const authController = {
  async signup(req: Request, res: Response) {
    const data = await authService.signup(req.body);
    return sendSuccess(res, data, 'Signup successful. Check your email for the verification code.', HttpStatus.CREATED);
  },

  async verifySignup(req: Request, res: Response) {
    const data = await authService.verifySignup(req.body);
    return sendSuccess(res, data, 'Email verified. Your account is now active.');
  },

  async login(req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await authService.login(req.body, meta(req));
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions);
    return sendSuccess(res, { user, accessToken }, 'Login successful.');
  },

  async verifyLogin(req: Request, res: Response) {
    const { accessToken, refreshToken, user } = await authService.verifyLogin(req.body, meta(req));
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions);
    return sendSuccess(res, { user, accessToken }, 'Login successful.');
  },

  async resendOtp(req: Request, res: Response) {
    const purpose = (req.body.purpose as OtpPurpose) ?? OtpPurpose.SIGNUP;
    const data = await authService.resendOtp({ email: req.body.email, purpose });
    return sendSuccess(res, data, 'A new code has been sent.');
  },

  async forgotPassword(req: Request, res: Response) {
    const data = await authService.forgotPassword(req.body);
    return sendSuccess(res, data, 'If the account exists, a reset code has been sent.');
  },

  async resetPassword(req: Request, res: Response) {
    const data = await authService.resetPassword(req.body);
    return sendSuccess(res, data, 'Password has been reset. Please log in.');
  },

  async changePassword(req: AuthenticatedRequest, res: Response) {
    const data = await authService.changePassword(req.user!.userId, req.body);
    return sendSuccess(res, data, 'Password changed successfully.');
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] ?? req.body.refreshToken;
    const { accessToken, refreshToken } = await authService.refresh(token, meta(req));
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, refreshCookieOptions);
    return sendSuccess(res, { accessToken }, 'Token refreshed.');
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
    await authService.logout(token);
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: '/' });
    return sendSuccess(res, { loggedOut: true }, 'Logged out.');
  },

  async me(req: AuthenticatedRequest, res: Response) {
    const data = await authService.me(req.user!.userId);
    return sendSuccess(res, data, 'Current user.');
  },
};
