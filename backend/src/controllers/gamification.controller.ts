import type { Response } from 'express';
import { gamificationService } from '@/services/gamification.service';
import { sendSuccess } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/interfaces';

export const gamificationController = {
  async profile(req: AuthenticatedRequest, res: Response) {
    const data = await gamificationService.getProfile(req.user!.userId);
    return sendSuccess(res, data, 'Gamification profile');
  },

  async attendLiveClass(req: AuthenticatedRequest, res: Response) {
    const data = await gamificationService.attendLiveClass(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Attendance recorded');
  },
};
