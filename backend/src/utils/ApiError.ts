import { HttpStatus } from '@/constants';

/**
 * Operational error carrying an HTTP status code.
 * Thrown anywhere; caught by the global error handler.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Bad request', details?: unknown) {
    return new ApiError(HttpStatus.BAD_REQUEST, msg, details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(HttpStatus.UNAUTHORIZED, msg);
  }
  static forbidden(msg = 'Forbidden') {
    return new ApiError(HttpStatus.FORBIDDEN, msg);
  }
  static notFound(msg = 'Resource not found') {
    return new ApiError(HttpStatus.NOT_FOUND, msg);
  }
  static conflict(msg = 'Conflict') {
    return new ApiError(HttpStatus.CONFLICT, msg);
  }
  static tooMany(msg = 'Too many requests') {
    return new ApiError(HttpStatus.TOO_MANY_REQUESTS, msg);
  }
  static internal(msg = 'Internal server error') {
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, msg);
  }
}
