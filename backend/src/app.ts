import path from 'path';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env } from '@/config/env';
import { HttpStatus } from '@/constants';
import { sendSuccess } from '@/utils/ApiResponse';
import { apiRateLimiter } from '@/middleware/rateLimiter';
import { requestLoggerMiddleware } from '@/middleware/requestLogger';
import { notFoundHandler } from '@/middleware/notFound';
import { errorHandler } from '@/middleware/errorHandler';
import { ApiError } from '@/utils/ApiError';
import { paymentService } from '@/services/payment.service';
import { router as apiRouter } from '@/routes';

/**
 * Build and configure the Express application.
 * Kept separate from server.ts so it can be imported in tests.
 */
export function createApp(): Application {
  const app = express();

  // Security & platform middleware
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(compression());

  // Razorpay webhook — MUST be registered with a RAW body parser BEFORE express.json(),
  // otherwise the parsed body breaks HMAC signature verification. Public (no auth).
  app.post(
    `${env.API_PREFIX}/payments/webhook`,
    express.raw({ type: '*/*' }),
    async (req: Request, res: Response) => {
      try {
        const signature = req.header('x-razorpay-signature');
        const result = await paymentService.handleWebhook(req.body as Buffer, signature);
        res.status(HttpStatus.OK).json({ success: true, ...result });
      } catch (err) {
        const status = err instanceof ApiError ? err.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
        res.status(status).json({ success: false, message: err instanceof Error ? err.message : 'Webhook error' });
      }
    },
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  // Static uploads (local storage driver)
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

  // Health check
  app.get('/health', (_req: Request, res: Response) =>
    sendSuccess(res, { status: 'ok', uptime: process.uptime() }, 'Service healthy', HttpStatus.OK),
  );

  // API routes (rate-limited)
  app.use(env.API_PREFIX, apiRateLimiter, apiRouter);

  // 404 + centralized error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
