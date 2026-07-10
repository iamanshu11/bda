import { Router } from 'express';
import { learningController } from '@/controllers/learning.controller';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Student learning flow. Mounted under /students; every route is authenticated
 * and enrollment + unlock checks happen in the service layer.
 */
const router = Router();
router.use(authenticate);

router.get('/courses/:courseId/learn', asyncHandler(learningController.courseLearn));
router.get('/modules/:id', asyncHandler(learningController.module));
router.post('/modules/:id/video-complete', asyncHandler(learningController.markVideo));
router.post('/modules/:id/notes-complete', asyncHandler(learningController.markNotes));
router.post('/modules/:id/quiz/submit', asyncHandler(learningController.submitQuiz));

export { router as learningRoutes };
