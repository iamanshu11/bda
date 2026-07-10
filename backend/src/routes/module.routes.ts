import { Router } from 'express';
import { moduleController } from '@/controllers/module.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';
import { RoleName } from '@/constants';

/**
 * Admin LMS management: modules, quiz config and questions.
 * Mounted under /admin so all routes require ADMIN / SUPER_ADMIN.
 */
const router = Router();
router.use(authenticate, authorize(RoleName.ADMIN, RoleName.SUPER_ADMIN));

// Modules under a course
router.get('/courses/:courseId/modules', asyncHandler(moduleController.list));
router.post('/courses/:courseId/modules', asyncHandler(moduleController.create));
router.post('/courses/:courseId/modules/reorder', asyncHandler(moduleController.reorder));

// Single module
router.get('/modules/:id', asyncHandler(moduleController.get));
router.patch('/modules/:id', asyncHandler(moduleController.update));
router.delete('/modules/:id', asyncHandler(moduleController.remove));

// Quiz + questions
router.put('/modules/:id/quiz', asyncHandler(moduleController.upsertQuiz));
router.post('/modules/:id/questions', asyncHandler(moduleController.addQuestion));
router.patch('/questions/:id', asyncHandler(moduleController.updateQuestion));
router.delete('/questions/:id', asyncHandler(moduleController.removeQuestion));

export { router as moduleAdminRoutes };
