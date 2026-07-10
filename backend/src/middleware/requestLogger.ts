import type { NextFunction, Request, Response } from 'express';
import { requestLogger } from '@/logger';

/** Logs every request with method, path, status and duration. */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    requestLogger.info('http_request', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  next();
}
