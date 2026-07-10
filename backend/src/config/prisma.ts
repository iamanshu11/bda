import { PrismaClient } from '@prisma/client';
import { isProd } from './env';

/**
 * Singleton Prisma client. In dev we cache on globalThis to avoid exhausting
 * the connection pool across hot-reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error'] : ['warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
