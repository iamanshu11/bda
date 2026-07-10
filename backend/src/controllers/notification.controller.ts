import type { Response } from 'express';
import { notificationService } from '@/services/notification.service';
import { sendSuccess } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/interfaces';

export const notificationController = {
  async list(req: AuthenticatedRequest, res: Response) {
    const unreadOnly = req.query.unread === 'true';
    const data = await notificationService.list(req.user!.userId, unreadOnly);
    return sendSuccess(res, data, 'Notifications');
  },

  async unreadCount(req: AuthenticatedRequest, res: Response) {
    const count = await notificationService.unreadCount(req.user!.userId);
    return sendSuccess(res, { count }, 'Unread count');
  },

  async markRead(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.markRead(req.user!.userId, req.params.id);
    return sendSuccess(res, data, 'Marked as read');
  },

  async markAllRead(req: AuthenticatedRequest, res: Response) {
    const data = await notificationService.markAllRead(req.user!.userId);
    return sendSuccess(res, data, 'All marked as read');
  },
};
