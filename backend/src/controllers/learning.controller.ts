import type { Response } from 'express';
import { z } from 'zod';
import { learningService } from '@/services/learning.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';
import type { AuthenticatedRequest } from '@/interfaces';

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selected: z.enum(['A', 'B', 'C', 'D']),
      }),
    )
    .min(1),
});

export const learningController = {
  async courseLearn(req: AuthenticatedRequest, res: Response) {
    const data = await learningService.getCourseLearn(req.user!.userId, req.params.courseId);
    return sendSuccess(res, data, 'Course learning view');
  },

  async module(req: AuthenticatedRequest, res: Response) {
    const data = await learningService.getModule(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Module');
  },

  async markVideo(req: AuthenticatedRequest, res: Response) {
    const data = await learningService.markVideo(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Video marked complete');
  },

  async markNotes(req: AuthenticatedRequest, res: Response) {
    const data = await learningService.markNotes(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Notes marked complete');
  },

  async submitQuiz(req: AuthenticatedRequest, res: Response) {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten());
    }
    const data = await learningService.submitQuiz(req.user!.userId, req.params.id, parsed.data.answers);
    return sendSuccess(res, data, data.passed ? 'Quiz passed' : 'Quiz submitted');
  },
};
