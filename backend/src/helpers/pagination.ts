import type { Request } from 'express';

/** Parse ?page & ?limit query params into safe skip/take values. */
export function getPagination(req: Request, defaultLimit = 12, maxLimit = 100) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
