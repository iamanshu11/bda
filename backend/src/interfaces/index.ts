import type { Request } from 'express';
import type { RoleName } from '@/constants';

/** Generic success envelope returned by every endpoint. */
export interface ApiResponseShape<T> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Decoded JWT access-token payload. */
export interface JwtPayload {
  userId: string;
  role: RoleName;
  permissions: string[];
}

/** Express Request augmented with the authenticated user. */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}
