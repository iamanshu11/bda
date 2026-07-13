import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';
import { emailService } from '@/services/email.service';
import { emailTemplates } from '@/emails/templates';
import { notificationService } from '@/services/notification.service';

/** Business logic for the authenticated student's own data. */
export const studentService = {
  async dashboard(userId: string) {
    const [enrollments, active, completed] = await Promise.all([
      prisma.enrollment.count({ where: { userId } }),
      prisma.enrollment.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } }),
    ]);
    const recent = await prisma.enrollment.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { title: true, slug: true, bannerUrl: true } } },
    });

    // Recent activity — most recently accessed modules
    const recentActivity = await prisma.studentModuleProgress.findMany({
      where: { userId },
      take: 6,
      orderBy: { lastViewedAt: 'desc' },
      include: { module: { select: { title: true, moduleNumber: true, courseId: true, course: { select: { title: true } } } } },
    });

    // Upcoming classes for the student's enrolled courses (+ general classes)
    const enrolledCourseIds = (
      await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } })
    ).map((e) => e.courseId);
    const upcomingClasses = await prisma.liveClass.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        OR: [{ courseId: { in: enrolledCourseIds } }, { courseId: null }],
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: { course: { select: { title: true } } },
    });

    return { stats: { enrollments, active, completed }, recent, recentActivity, upcomingClasses };
  },

  myCourses(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { course: { include: { category: true } } },
    });
  },

  async enroll(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found.');

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw ApiError.conflict('You are already enrolled in this course.');

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId, status: 'ACTIVE' },
    });

    notificationService.emit(userId, 'Enrolled successfully', `You are now enrolled in ${course.title}. Start learning!`);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      void emailService
        .send(
          user.email,
          'Enrollment confirmed — Bokaro Defence Academy',
          emailTemplates.enrollmentConfirmation(user.name, course.title),
        )
        .catch(() => undefined);
    }
    return enrollment;
  },

  getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        state: true,
        academyId: true,
        academy: { select: { id: true, name: true } },
        createdAt: true,
      },
    });
  },

  listAcademies() {
    return prisma.academy.findMany({ orderBy: { name: 'asc' } });
  },

  updateProfile(
    userId: string,
    data: { name?: string; phone?: string; avatarUrl?: string; state?: string; academyId?: string | null },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        state: true,
        academyId: true,
        academy: { select: { id: true, name: true } },
      },
    });
  },
};
