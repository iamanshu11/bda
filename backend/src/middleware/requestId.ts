import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Attach a correlation id to every request (reusing an inbound
 * `x-request-id` when a proxy already set one). Exposed back on the response
 * so clients/log aggregators can correlate a single request end-to-end.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.get('x-request-id');
  const id = incoming && incoming.length <= 100 ? incoming : crypto.randomUUID();
  (req as Request & { id?: string }).id = id;
  res.setHeader('x-request-id', id);
  next();
}
