import path from 'path';
import express, { type Application, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { env, isProd } from '@/config/env';
import { HttpStatus } from '@/constants';
import { sendSuccess } from '@/utils/ApiResponse';
import { apiRateLimiter } from '@/middleware/rateLimiter';
import { requestIdMiddleware } from '@/middleware/requestId';
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

  // Security headers. The API serves JSON + static uploads only (no HTML app),
  // so a strict CSP is safe. HSTS is enabled in production only.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          upgradeInsecureRequests: isProd ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow the frontend origin to load /uploads
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: isProd ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), fullscreen=(self)',
    );
    next();
  });

  // CORS allowlist: CLIENT_URL plus any comma-separated CLIENT_URLS.
  const allowedOrigins = [
    env.CLIENT_URL,
    ...env.CLIENT_URLS.split(',').map((o) => o.trim()).filter(Boolean),
  ];
  app.use(
    cors({
      origin(origin, cb) {
        // Allow non-browser / server-to-server requests (no Origin header).
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin not allowed by CORS: ${origin}`));
      },
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
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Static uploads (local storage driver). Harden against inline execution of
  // user-uploaded content: nosniff, and force download for anything that isn't
  // a plain image (PDFs/videos are still previewable by the browser's viewer).
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      setHeaders: (res, filePath) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const ext = path.extname(filePath).toLowerCase();
        const inlineOk = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.mp4', '.webm', '.mov'];
        if (!inlineOk.includes(ext)) {
          res.setHeader('Content-Disposition', 'attachment');
        }
      },
    }),
  );

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
