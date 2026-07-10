import type { Response } from 'express';
import { prisma } from '@/config/prisma';
import { sendSuccess } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/interfaces';

export const dashboardController = {
  /** Aggregate counts + recent activity for the admin overview. */
  async adminOverview(_req: AuthenticatedRequest, res: Response) {
    const [users, courses, enrollments, newMessages, recentMessages, recentEnrollments] =
      await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.contactMessage.count({ where: { status: 'NEW' } }),
        prisma.contactMessage.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
        prisma.enrollment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } }, course: { select: { title: true } } },
        }),
      ]);

    return sendSuccess(
      res,
      {
        stats: { users, courses, enrollments, newMessages },
        recentMessages,
        recentEnrollments,
      },
      'Admin overview',
    );
  },
};
