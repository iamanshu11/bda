import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { sendSuccess } from '@/utils/ApiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { RoleName } from '@/constants';
import type { AuthenticatedRequest } from '@/interfaces';

/**
 * Cross-cutting protected routes not tied to a single resource.
 * (Student and Admin surfaces live in student.routes.ts / admin.routes.ts.)
 */

// /api/v1/dashboard — role-aware entry point the frontend hits post-login
export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);
dashboardRoutes.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) =>
    sendSuccess(res, { role: req.user!.role }, 'Dashboard entry'),
  ),
);

// /api/v1/settings — public read, super-admin write
export const settingsRoutes = Router();
settingsRoutes.get(
  '/',
  asyncHandler(async (_req, res) =>
    sendSuccess(res, { siteName: 'Bokaro Defence Academy' }, 'Public settings'),
  ),
);
settingsRoutes.put(
  '/',
  authenticate,
  authorize(RoleName.SUPER_ADMIN),
  asyncHandler(async (req, res) => sendSuccess(res, req.body, 'Settings updated')),
);
