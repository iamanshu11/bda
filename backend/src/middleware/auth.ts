import type { NextFunction, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import { verifyAccessToken } from '@/helpers/jwt';
import type { AuthenticatedRequest } from '@/interfaces';
import type { RoleName } from '@/constants';

/**
 * Verify the Bearer access token and attach the decoded user to the request.
 */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header');
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }
}

/**
 * Role-based guard. Use after `authenticate`.
 * @example router.get('/admin', authenticate, authorize(RoleName.ADMIN, RoleName.SUPER_ADMIN), handler)
 */
export function authorize(...allowed: RoleName[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!allowed.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to access this resource');
    }
    next();
  };
}

/** Permission-based guard (checks the JWT permissions array; '*' = all). */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    const perms = req.user.permissions ?? [];
    if (!perms.includes('*') && !perms.includes(permission)) {
      throw ApiError.forbidden(`Missing permission: ${permission}`);
    }
    next();
  };
}
