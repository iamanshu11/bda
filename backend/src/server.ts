import { createApp } from './app';
import { env } from '@/config/env';
import { prisma } from '@/config/prisma';
import { logger } from '@/logger';

async function bootstrap() {
  const app = createApp();

  // Verify DB connectivity before accepting traffic
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed', err);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 BDA API running on http://localhost:${env.PORT}${env.API_PREFIX}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection', reason));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    process.exit(1);
  });
}

void bootstrap();
