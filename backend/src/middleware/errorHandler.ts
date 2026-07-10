import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';
import { isProd } from '@/config/env';
import { logger } from '@/logger';

/** Prisma known-request error shape (duck-typed to avoid a hard type dependency). */
interface PrismaKnownError extends Error {
  code: string;
  meta?: { target?: string[] };
}

function isPrismaKnownError(err: unknown): err is PrismaKnownError {
  return (
    err instanceof Error &&
    err.name === 'PrismaClientKnownRequestError' &&
    typeof (err as { code?: unknown }).code === 'string'
  );
}

/**
 * Central error handler. Normalizes ApiError, Prisma and Zod errors into the
 * generic response envelope. Must be registered last.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = HttpStatus.UNPROCESSABLE;
    message = 'Validation failed';
    details = err.flatten().fieldErrors;
  } else if (isPrismaKnownError(err)) {
    if (err.code === 'P2002') {
      statusCode = HttpStatus.CONFLICT;
      message = `Duplicate value for ${err.meta?.target?.join(', ') ?? 'field'}`;
    } else if (err.code === 'P2025') {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Record not found';
    } else {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Database request error';
    }
  } else if (err instanceof Error) {
    message = err.message;
  } else if (err && typeof err === 'object' && 'error' in err) {
    // Razorpay SDK throws plain objects: { statusCode, error: { code, description } }
    const rzp = err as { statusCode?: number; error?: { description?: string } };
    statusCode = rzp.statusCode && rzp.statusCode >= 400 ? HttpStatus.BAD_REQUEST : statusCode;
    message = rzp.error?.description ?? message;
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${message}`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(details ? { errors: details } : {}),
    ...(isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}
