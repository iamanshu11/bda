import type { NextFunction, Request, Response } from 'express';
import { requestLogger } from '@/logger';
import type { AuthenticatedRequest } from '@/interfaces';

/**
 * Logs every request with method, path, status, duration, correlation id and
 * (once auth has run) the acting user id. Never logs bodies, tokens, OTPs or
 * secrets — only safe request metadata.
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    requestLogger.info('http_request', {
      requestId: (req as Request & { id?: string }).id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userId: (req as AuthenticatedRequest).user?.userId,
      userAgent: req.get('user-agent'),
    });
  });
  next();
}
