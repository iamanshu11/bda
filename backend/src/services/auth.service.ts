import crypto from 'crypto';
import { authRepository } from '@/repositories/auth.repository';
import { emailService } from '@/services/email.service';
import { emailTemplates } from '@/emails/templates';
import { ApiError } from '@/utils/ApiError';
import { hashPassword, comparePassword } from '@/helpers/password';
import { generateOtp, hashOtp, compareOtp, otpExpiry } from '@/helpers/otp';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/helpers/jwt';
import { OtpPurpose, RoleName } from '@/constants';
import { env } from '@/config/env';
import type { JwtPayload } from '@/interfaces';
import { addDays } from '@/helpers/date';

const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: { name: RoleName };
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    role: user.role.name,
  };
}

async function issueOtp(userId: string, purpose: OtpPurpose): Promise<string> {
  // Enforce resend cooldown
  const existing = await authRepository.latestOtp(userId, purpose);
  if (existing) {
    const secondsSince = (Date.now() - existing.createdAt.getTime()) / 1000;
    if (secondsSince < env.OTP_RESEND_SECONDS) {
      throw ApiError.tooMany(
        `Please wait ${Math.ceil(env.OTP_RESEND_SECONDS - secondsSince)}s before requesting a new code.`,
      );
    }
  }
  await authRepository.invalidateOtps(userId, purpose);
  const code = generateOtp();
  await authRepository.createOtp({
    userId,
    codeHash: await hashOtp(code),
    purpose,
    expiresAt: otpExpiry(),
  });
  return code;
}

async function verifyOtp(userId: string, purpose: OtpPurpose, code: string): Promise<void> {
  const otp = await authRepository.latestOtp(userId, purpose);
  if (!otp) throw ApiError.badRequest('No active code found. Please request a new one.');
  if (otp.expiresAt < new Date()) throw ApiError.badRequest('Code has expired.');
  const ok = await compareOtp(code, otp.codeHash);
  if (!ok) throw ApiError.badRequest('Invalid code.');
  await authRepository.consumeOtp(otp.id); // single use
}

async function issueTokens(payload: JwtPayload, meta: RequestMeta) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload.userId);
  await authRepository.storeRefreshToken({
    userId: payload.userId,
    tokenHash: sha256(refreshToken),
    expiresAt: addDays(new Date(), 7),
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
  });
  return { accessToken, refreshToken };
}

export const authService = {
  /** SIGNUP → create user (inactive) → email signup OTP. */
  async signup(input: { name: string; email: string; password: string }) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) throw ApiError.conflict('An account with this email already exists.');

    const studentRole = await authRepository.getRoleByName(RoleName.STUDENT);
    if (!studentRole) throw ApiError.internal('Student role missing. Run the seed script.');

    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      roleId: studentRole.id,
    });

    const code = await issueOtp(user.id, OtpPurpose.SIGNUP);
    await emailService.send(
      user.email,
      'Verify your email — Bokaro Defence Academy',
      emailTemplates.signupOtp(user.name, code, env.OTP_EXPIRY_MINUTES),
    );

    return { userId: user.id, email: user.email };
  },

  /** Verify signup OTP → activate account → welcome email. */
  async verifySignup(input: { email: string; code: string }) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw ApiError.notFound('Account not found.');
    await verifyOtp(user.id, OtpPurpose.SIGNUP, input.code);
    await authRepository.markEmailVerified(user.id);
    await emailService.send(
      user.email,
      'Welcome to Bokaro Defence Academy',
      emailTemplates.welcome(user.name),
    );
    return { verified: true };
  },

  /** LOGIN: validate credentials → issue JWT + refresh token (no OTP). */
  async login(input: { email: string; password: string }, meta: RequestMeta) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw ApiError.unauthorized('Invalid email or password.');
    if (!user.isActive) throw ApiError.forbidden('Account is disabled.');

    const ok = await comparePassword(input.password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid email or password.');

    if (!user.isEmailVerified) {
      const code = await issueOtp(user.id, OtpPurpose.SIGNUP);
      await emailService.send(
        user.email,
        'Verify your email — Bokaro Defence Academy',
        emailTemplates.signupOtp(user.name, code, env.OTP_EXPIRY_MINUTES),
      );
      throw ApiError.forbidden('Email not verified. A new verification code has been sent.');
    }

    const payload: JwtPayload = {
      userId: user.id,
      role: user.role.name,
      permissions: user.role.permissions,
    };
    const tokens = await issueTokens(payload, meta);
    await authRepository.touchLastLogin(user.id);
    return { user: toPublicUser(user), ...tokens };
  },

  /** @deprecated Login no longer uses OTP. Kept for backwards compatibility. */
  async verifyLogin(input: { email: string; code: string }, meta: RequestMeta) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw ApiError.notFound('Account not found.');
    await verifyOtp(user.id, OtpPurpose.LOGIN, input.code);

    const payload: JwtPayload = {
      userId: user.id,
      role: user.role.name,
      permissions: user.role.permissions,
    };
    const tokens = await issueTokens(payload, meta);
    await authRepository.touchLastLogin(user.id);
    return { user: toPublicUser(user), ...tokens };
  },

  /** Resend an OTP for a given purpose. */
  async resendOtp(input: { email: string; purpose: OtpPurpose }) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw ApiError.notFound('Account not found.');
    const code = await issueOtp(user.id, input.purpose);
    const tpl =
      input.purpose === OtpPurpose.LOGIN
        ? emailTemplates.loginOtp
        : input.purpose === OtpPurpose.RESET_PASSWORD
          ? emailTemplates.forgotPassword
          : emailTemplates.signupOtp;
    await emailService.send(user.email, 'Your verification code', tpl(user.name, code, env.OTP_EXPIRY_MINUTES));
    return { sent: true };
  },

  /** FORGOT PASSWORD: email reset OTP (silent if account doesn't exist). */
  async forgotPassword(input: { email: string }) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) return { sent: true }; // don't leak account existence
    const code = await issueOtp(user.id, OtpPurpose.RESET_PASSWORD);
    await emailService.send(
      user.email,
      'Reset your password — Bokaro Defence Academy',
      emailTemplates.forgotPassword(user.name, code, env.OTP_EXPIRY_MINUTES),
    );
    return { sent: true };
  },

  /** RESET PASSWORD: verify reset OTP → set new password → revoke sessions. */
  async resetPassword(input: { email: string; code: string; newPassword: string }) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) throw ApiError.notFound('Account not found.');
    await verifyOtp(user.id, OtpPurpose.RESET_PASSWORD, input.code);
    await authRepository.updatePassword(user.id, await hashPassword(input.newPassword));
    await authRepository.revokeAllUserTokens(user.id);
    return { reset: true };
  },

  /** CHANGE PASSWORD (authenticated). */
  async changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw ApiError.notFound('Account not found.');
    const ok = await comparePassword(input.currentPassword, user.passwordHash);
    if (!ok) throw ApiError.badRequest('Current password is incorrect.');
    await authRepository.updatePassword(user.id, await hashPassword(input.newPassword));
    await authRepository.revokeAllUserTokens(user.id);
    return { changed: true };
  },

  /** REFRESH: rotate refresh token → new access token. */
  async refresh(refreshToken: string, meta: RequestMeta) {
    if (!refreshToken) throw ApiError.unauthorized('Missing refresh token.');
    let decoded: { userId: string };
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token.');
    }

    const stored = await authRepository.findRefreshToken(sha256(refreshToken));
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token is no longer valid.');
    }

    const user = await authRepository.findUserById(decoded.userId);
    if (!user) throw ApiError.unauthorized();

    // Rotate: revoke old, issue new pair
    await authRepository.revokeRefreshToken(stored.tokenHash);
    const payload: JwtPayload = {
      userId: user.id,
      role: user.role.name,
      permissions: user.role.permissions,
    };
    return issueTokens(payload, meta);
  },

  /** LOGOUT: revoke the presented refresh token. */
  async logout(refreshToken?: string) {
    if (refreshToken) await authRepository.revokeRefreshToken(sha256(refreshToken));
    return { loggedOut: true };
  },

  /** Current authenticated user profile. */
  async me(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw ApiError.notFound('Account not found.');
    return toPublicUser(user);
  },
};
