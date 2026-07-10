import { prisma } from '@/config/prisma';
import { getCadetLevel } from '@/helpers/cadetRank';
import { gamificationService } from '@/services/gamification.service';

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Aggregates everything the Cadet Command Center shows:
 * mission progress, current operation, weekly performance, study streak,
 * cadet rank, today's briefing and command announcements.
 */
export const commandCenterService = {
  async overview(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true } } },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const modules = await prisma.courseModule.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, courseId: true, title: true, moduleNumber: true, order: true },
      orderBy: { order: 'asc' },
    });

    const progress = await prisma.studentModuleProgress.findMany({
      where: { userId },
      include: { module: { select: { title: true, moduleNumber: true, courseId: true, course: { select: { title: true } } } } },
    });
    const completedByModule = new Map(progress.map((p) => [p.moduleId, p]));

    // ---- Mission progress (per training mission = course) ----
    const missions = enrollments.map((e) => {
      const courseModules = modules.filter((m) => m.courseId === e.courseId);
      const total = courseModules.length;
      const completed = courseModules.filter((m) => completedByModule.get(m.id)?.completed).length;
      return {
        courseId: e.courseId,
        title: e.course.title,
        total,
        completed,
        percentage: total ? Math.round((completed / total) * 100) : 0,
      };
    });
    const totalModules = modules.length;
    const completedModules = progress.filter((p) => p.completed).length;
    const overallPercentage = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;

    // ---- Current operation (resume point) ----
    const viewed = [...progress].sort((a, b) => b.lastViewedAt.getTime() - a.lastViewedAt.getTime());
    const inProgress = viewed.find((p) => !p.completed) ?? viewed[0];
    let currentOperation: null | {
      courseId: string;
      courseTitle: string;
      moduleId: string;
      moduleTitle: string;
      moduleNumber: number;
    } = null;
    if (inProgress) {
      currentOperation = {
        courseId: inProgress.module.courseId,
        courseTitle: inProgress.module.course.title,
        moduleId: inProgress.moduleId,
        moduleTitle: inProgress.module.title,
        moduleNumber: inProgress.module.moduleNumber,
      };
    } else if (enrollments[0]) {
      const first = modules.find((m) => m.courseId === enrollments[0].courseId);
      if (first) {
        currentOperation = {
          courseId: enrollments[0].courseId,
          courseTitle: enrollments[0].course.title,
          moduleId: first.id,
          moduleTitle: first.title,
          moduleNumber: first.moduleNumber,
        };
      }
    }

    // ---- Weekly performance (last 7 days) ----
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekProgress = progress.filter((p) => p.updatedAt >= weekAgo);
    const weeklyCompleted = progress.filter((p) => p.completedAt && p.completedAt >= weekAgo).length;
    const weeklyQuizzes = progress.filter((p) => p.quizAttempted && p.updatedAt >= weekAgo && p.quizScore != null);
    const avgScore = weeklyQuizzes.length
      ? Math.round((weeklyQuizzes.reduce((s, p) => s + (p.quizScore ?? 0), 0) / weeklyQuizzes.length) * 10) / 10
      : 0;

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyActivity = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const key = dayKey(d);
      const count = weekProgress.filter((p) => dayKey(p.lastViewedAt) === key).length;
      return { day: dayLabels[d.getDay()], date: key, count };
    });

    // ---- Study streak ----
    const activeDays = new Set(progress.map((p) => dayKey(p.lastViewedAt)));
    let current = 0;
    const cursor = startOfToday();
    if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // allow "yesterday" grace
    while (activeDays.has(dayKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    // longest
    const sortedDays = [...activeDays].sort();
    let longest = 0;
    let run = 0;
    let prevDate: Date | null = null;
    for (const key of sortedDays) {
      const d = new Date(key);
      if (prevDate && (d.getTime() - prevDate.getTime()) / 86400000 === 1) run += 1;
      else run = 1;
      longest = Math.max(longest, run);
      prevDate = d;
    }

    // ---- Cadet rank (XP-based level) ----
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } });
    const rank = getCadetLevel(user?.totalXp ?? 0);
    const gamification = await gamificationService.getProfile(userId);

    // ---- Today's briefing (classes scheduled today or next) ----
    const todaysClasses = await prisma.liveClass.findMany({
      where: {
        scheduledAt: { gte: startOfToday() },
        OR: [{ courseId: { in: courseIds } }, { courseId: null }],
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: { course: { select: { title: true } } },
    });

    // ---- Command announcements ----
    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });

    return {
      missionProgress: { overallPercentage, completedModules, totalModules, missions },
      currentOperation,
      weeklyPerformance: {
        modulesCompleted: weeklyCompleted,
        quizzesTaken: weeklyQuizzes.length,
        avgScore,
        dailyActivity,
      },
      studyStreak: { current, longest, todayDone: activeDays.has(dayKey(startOfToday())) },
      cadetRank: rank,
      gamification: gamification
        ? {
            totalXp: gamification.totalXp,
            level: gamification.level,
            achievements: gamification.achievements,
            recentXp: gamification.recentXp,
          }
        : null,
      todaysBriefing: { classes: todaysClasses },
      announcements,
    };
  },
};
