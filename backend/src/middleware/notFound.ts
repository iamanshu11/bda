import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';

/** Forwards unmatched routes to the error handler as a 404. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
