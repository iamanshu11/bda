import type { Response } from 'express';
import { commandCenterService } from '@/services/commandCenter.service';
import { sendSuccess } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/interfaces';

export const commandCenterController = {
  async overview(req: AuthenticatedRequest, res: Response) {
    const data = await commandCenterService.overview(req.user!.userId);
    return sendSuccess(res, data, 'Cadet Command Center');
  },
};
