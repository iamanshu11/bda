import { prisma } from '@/config/prisma';
import type { OtpPurpose, RoleName } from '@/constants';

/**
 * Data-access layer for authentication. Controllers/services never touch
 * Prisma directly — keeps queries reusable and swappable.
 */
export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, include: { role: true } });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { role: true } });
  },

  getRoleByName(name: RoleName) {
    return prisma.role.findUnique({ where: { name } });
  },

  createUser(data: { name: string; email: string; passwordHash: string; roleId: string }) {
    return prisma.user.create({ data, include: { role: true } });
  },

  markEmailVerified(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
  },

  updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  touchLastLogin(userId: string) {
    return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  },

  // ---- OTP ----
  createOtp(data: { userId: string; codeHash: string; purpose: OtpPurpose; expiresAt: Date }) {
    return prisma.otp.create({ data });
  },

  latestOtp(userId: string, purpose: OtpPurpose) {
    return prisma.otp.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  },

  consumeOtp(id: string) {
    return prisma.otp.update({ where: { id }, data: { consumedAt: new Date() } });
  },

  invalidateOtps(userId: string, purpose: OtpPurpose) {
    return prisma.otp.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  },

  // ---- Refresh tokens ----
  storeRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshToken(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revokeRefreshToken(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllUserTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
