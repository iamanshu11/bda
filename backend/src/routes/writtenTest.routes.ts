import { Router } from 'express';
import { writtenTestController } from '@/controllers/writtenTest.controller';
import { authenticate } from '@/middleware/auth';
import { asyncHandler } from '@/utils/asyncHandler';

const router = Router();

// Public catalog (no auth)
router.get('/tests', asyncHandler(writtenTestController.listPublic));
router.get('/tests/:slug', asyncHandler(writtenTestController.getPublic));

export { router as publicTestRoutes };

/** Authenticated student written-test routes — mount under /students */
export const studentTestRoutes = Router();
studentTestRoutes.use(authenticate);

studentTestRoutes.get('/tests', asyncHandler(writtenTestController.listMine));
studentTestRoutes.get('/tests/:id', asyncHandler(writtenTestController.getMine));
studentTestRoutes.post('/tests/:id/order', asyncHandler(writtenTestController.createOrder));
studentTestRoutes.post('/tests/:id/start', asyncHandler(writtenTestController.start));
studentTestRoutes.post('/tests/:id/heartbeat', asyncHandler(writtenTestController.heartbeat));
studentTestRoutes.post('/tests/:id/answers', asyncHandler(writtenTestController.saveAnswers));
studentTestRoutes.post('/tests/:id/violations', asyncHandler(writtenTestController.violation));
studentTestRoutes.post('/tests/:id/submit', asyncHandler(writtenTestController.submit));
studentTestRoutes.get('/tests/:id/result', asyncHandler(writtenTestController.result));
