import { Router } from 'express';
import { uploadController } from '@/controllers/upload.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { upload } from '@/middleware/upload';
import { asyncHandler } from '@/utils/asyncHandler';
import { RoleName } from '@/constants';

/** Authenticated media upload (admins + faculty). */
const router = Router();

router.post(
  '/',
  authenticate,
  authorize(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.FACULTY),
  upload.single('file'),
  asyncHandler(async (req, res) => uploadController.single(req, res)),
);

export { router as uploadRoutes };
