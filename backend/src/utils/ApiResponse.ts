import type { Response } from 'express';
import { HttpStatus } from '@/constants';
import type { ApiResponseShape, PaginationMeta } from '@/interfaces';

/**
 * Generic success responder. Keeps the response envelope identical everywhere.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode: number = HttpStatus.OK,
  meta?: PaginationMeta,
): Response {
  const body: ApiResponseShape<T> = { success: true, message, data, ...(meta ? { meta } : {}) };
  return res.status(statusCode).json(body);
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
