import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';

/** Course reviews — only students who completed the course may submit. */
export const reviewService = {
  /** Has this user completed every module of the course? */
  async hasCompleted(userId: string, courseId: string): Promise<boolean> {
    const total = await prisma.courseModule.count({ where: { courseId } });
    if (total === 0) return false;
    const done = await prisma.studentModuleProgress.count({
      where: { userId, completed: true, module: { courseId } },
    });
    return done >= total;
  },

  /** Whether the user may review (enrolled + completed + not yet reviewed). */
  async eligibility(userId: string, courseId: string) {
    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    const completed = enrolled ? await this.hasCompleted(userId, courseId) : false;
    const existing = await prisma.courseReview.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    return { canReview: completed && !existing, completed, alreadyReviewed: Boolean(existing), review: existing };
  },

  async submit(userId: string, courseId: string, data: { rating: number; title?: string; body?: string }) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found.');
    if (!(await this.hasCompleted(userId, courseId))) {
      throw ApiError.forbidden('You can review a course only after completing it.');
    }
    return prisma.courseReview.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { rating: data.rating, title: data.title, body: data.body, isApproved: false },
      create: { userId, courseId, rating: data.rating, title: data.title, body: data.body },
    });
  },

  /** Public: approved reviews + aggregate for a course. */
  async publicForCourse(courseId: string) {
    const [reviews, agg] = await Promise.all([
      prisma.courseReview.findMany({
        where: { courseId, isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: { user: { select: { name: true } } },
      }),
      prisma.courseReview.aggregate({
        where: { courseId, isApproved: true },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        author: r.user?.name ?? 'Cadet',
        createdAt: r.createdAt,
      })),
      average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      count: agg._count._all,
    };
  },
};
