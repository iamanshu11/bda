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

  /** Revenue + engagement analytics for the admin dashboard. */
  async adminAnalytics(_req: AuthenticatedRequest, res: Response) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const [
      revenueToday,
      revenueMonth,
      totalStudents,
      activeUsers,
      newToday,
      newThisWeek,
      courseSales,
      refunds,
      pendingPayments,
      topCoursesRaw,
      recentPayments,
    ] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', updatedAt: { gte: startOfDay } } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', updatedAt: { gte: startOfMonth } } }),
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.count({ where: { status: 'REFUNDED' } }),
      prisma.payment.count({ where: { status: 'CREATED' } }),
      prisma.payment.groupBy({
        by: ['courseId'],
        where: { status: 'PAID' },
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
      prisma.payment.findMany({
        where: { status: 'PAID' },
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: { user: { select: { name: true } }, course: { select: { title: true } } },
      }),
    ]);

    // Resolve course titles for the top-courses list (courseId may be null for test payments)
    const topCourseIds = topCoursesRaw.map((t) => t.courseId).filter((id): id is string => Boolean(id));
    const topCourseTitles = await prisma.course.findMany({
      where: { id: { in: topCourseIds } },
      select: { id: true, title: true },
    });
    const titleById = new Map(topCourseTitles.map((c) => [c.id, c.title]));
    const topCourses = topCoursesRaw
      .filter((t): t is typeof t & { courseId: string } => Boolean(t.courseId))
      .map((t) => ({
        courseId: t.courseId,
        title: titleById.get(t.courseId) ?? 'Course',
        sales: t._count._all,
        revenue: (t._sum.amount ?? 0) / 100,
      }));

    return sendSuccess(
      res,
      {
        revenue: {
          today: (revenueToday._sum.amount ?? 0) / 100,
          month: (revenueMonth._sum.amount ?? 0) / 100,
        },
        stats: {
          totalStudents,
          activeUsers,
          newToday,
          newThisWeek,
          courseSales,
          refunds,
          pendingPayments,
        },
        topCourses,
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          amount: p.amount / 100,
          user: p.user?.name ?? '—',
          course: p.course?.title ?? '—',
          createdAt: p.updatedAt,
        })),
      },
      'Admin analytics',
    );
  },
};
