import type { NextFunction, Request, Response } from 'express';

/**
 * Wraps async route handlers so thrown/rejected errors are forwarded to the
 * global error middleware instead of crashing the process.
 */
export const asyncHandler =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
