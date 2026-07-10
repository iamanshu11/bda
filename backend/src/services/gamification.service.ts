import { AchievementCode, XpAction } from '@prisma/client';
import { prisma } from '@/config/prisma';
import { XP_REWARDS } from '@/constants/gamification';
import { getCadetLevel } from '@/helpers/cadetRank';
import { notificationService } from '@/services/notification.service';

export interface GamificationReward {
  xpEarned: number;
  totalXp: number;
  level: ReturnType<typeof getCadetLevel>;
  levelUp: boolean;
  newAchievements: { code: string; title: string; icon: string }[];
}

function emptyReward(totalXp: number): GamificationReward {
  return { xpEarned: 0, totalXp, level: getCadetLevel(totalXp), levelUp: false, newAchievements: [] };
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function computeStreak(lastViewedDates: Date[]) {
  const activeDays = new Set(lastViewedDates.map(dayKey));
  let current = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return current;
}

function matchesSubject(title: string, keywords: string[]) {
  const lower = title.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export const gamificationService = {
  /** Idempotent XP grant — returns reward summary. */
  async awardXp(
    userId: string,
    action: XpAction,
    referenceId: string,
    amount: number = XP_REWARDS[action],
  ): Promise<GamificationReward> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } });
    if (!user) return emptyReward(0);

    const prevLevel = getCadetLevel(user.totalXp);
    const existing = await prisma.xpTransaction.findUnique({
      where: { userId_action_referenceId: { userId, action, referenceId } },
    });
    if (existing) return emptyReward(user.totalXp);

    await prisma.$transaction([
      prisma.xpTransaction.create({ data: { userId, action, amount, referenceId } }),
      prisma.user.update({ where: { id: userId }, data: { totalXp: { increment: amount } } }),
    ]);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { totalXp: true } });
    const level = getCadetLevel(updated.totalXp);
    const levelUp = level.tier > prevLevel.tier;

    if (levelUp) {
      void notificationService.emit(userId, `Promoted to ${level.name}! 🎖️`, `You've reached ${level.name}. Keep training, cadet!`);
    }

    return { xpEarned: amount, totalXp: updated.totalXp, level, levelUp, newAchievements: [] };
  },

  async grantAchievement(userId: string, code: AchievementCode) {
    const achievement = await prisma.achievement.findUnique({ where: { code } });
    if (!achievement) return null;

    const earned = await prisma.userAchievement
      .create({
        data: { userId, achievementId: achievement.id },
        include: { achievement: true },
      })
      .catch(() => null);

    if (earned) {
      void notificationService.emit(
        userId,
        `Achievement unlocked: ${earned.achievement.title} 🏆`,
        earned.achievement.description,
      );
      return { code: earned.achievement.code, title: earned.achievement.title, icon: earned.achievement.icon };
    }
    return null;
  },

  /** Run all achievement checks after a learning milestone. */
  async checkAchievements(
    userId: string,
    ctx?: { moduleTitle?: string; courseId?: string },
  ): Promise<{ code: string; title: string; icon: string }[]> {
    const progress = await prisma.studentModuleProgress.findMany({
      where: { userId },
      include: { module: { select: { title: true, courseId: true } } },
    });
    const completed = progress.filter((p) => p.completed);
    const quizPassed = progress.filter((p) => p.quizPassed).length;
    const streak = computeStreak(progress.map((p) => p.lastViewedAt));
    const liveAttended = await prisma.liveClassAttendance.count({ where: { userId } });

    const checks: { code: AchievementCode; met: boolean }[] = [
      { code: 'FIRST_MISSION', met: completed.length >= 1 },
      { code: 'STREAK_7', met: streak >= 7 },
      { code: 'QUIZ_MASTER', met: quizPassed >= 10 },
      { code: 'PERFECT_ATTENDANCE', met: liveAttended >= 5 },
      { code: 'DEFENCE_SCHOLAR', met: completed.length >= 10 },
      {
        code: 'CONSTITUTION_EXPERT',
        met: completed.some((p) =>
          matchesSubject(p.module.title, ['constitution', 'polity', 'general knowledge', 'gk']),
        ),
      },
      {
        code: 'MATHS_WARRIOR',
        met: completed.some((p) => matchesSubject(p.module.title, ['math', 'mathematics', 'arithmetic'])),
      },
    ];

    // Also check current module title for subject achievements
    if (ctx?.moduleTitle) {
      if (matchesSubject(ctx.moduleTitle, ['constitution', 'polity', 'general knowledge', 'gk'])) {
        checks.find((c) => c.code === 'CONSTITUTION_EXPERT')!.met = true;
      }
      if (matchesSubject(ctx.moduleTitle, ['math', 'mathematics', 'arithmetic'])) {
        checks.find((c) => c.code === 'MATHS_WARRIOR')!.met = true;
      }
    }

    const unlocked: { code: string; title: string; icon: string }[] = [];
    for (const { code, met } of checks) {
      if (!met) continue;
      const a = await this.grantAchievement(userId, code);
      if (a) unlocked.push(a);
    }
    return unlocked;
  },

  /** Award course-completion XP when every module in a course is done. */
  async checkCourseComplete(userId: string, courseId: string): Promise<GamificationReward> {
    const modules = await prisma.courseModule.findMany({ where: { courseId }, select: { id: true } });
    if (modules.length === 0) return emptyReward(0);

    const completed = await prisma.studentModuleProgress.count({
      where: { userId, moduleId: { in: modules.map((m) => m.id) }, completed: true },
    });
    if (completed < modules.length) return emptyReward(0);

    const reward = await this.awardXp(userId, 'COURSE_COMPLETED', courseId);
    await prisma.enrollment.updateMany({
      where: { userId, courseId },
      data: { status: 'COMPLETED', progress: 100 },
    });
    return reward;
  },

  /** Mark live class attendance and award XP. */
  async attendLiveClass(userId: string, liveClassId: string): Promise<GamificationReward> {
    const liveClass = await prisma.liveClass.findUnique({ where: { id: liveClassId } });
    if (!liveClass) return emptyReward(0);

    await prisma.liveClassAttendance.upsert({
      where: { userId_liveClassId: { userId, liveClassId } },
      update: {},
      create: { userId, liveClassId },
    });

    const reward = await this.awardXp(userId, 'LIVE_CLASS_ATTENDED', liveClassId);
    const achievements = await this.checkAchievements(userId);
    return { ...reward, newAchievements: achievements };
  },

  /** Process learning progress transitions and award XP + achievements. */
  async onProgressChange(
    userId: string,
    before: { videoCompleted: boolean; notesCompleted: boolean; quizPassed: boolean; completed: boolean },
    after: { videoCompleted: boolean; notesCompleted: boolean; quizPassed: boolean; completed: boolean },
    moduleId: string,
    moduleTitle: string,
    courseId: string,
  ): Promise<GamificationReward> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true } });
    if (!user) return emptyReward(0);

    const prevLevel = getCadetLevel(user.totalXp);
    let xpEarned = 0;
    const newAchievements: { code: string; title: string; icon: string }[] = [];

    if (!before.videoCompleted && after.videoCompleted) {
      const r = await this.awardXp(userId, 'VIDEO_WATCHED', moduleId);
      xpEarned += r.xpEarned;
    }
    if (!before.notesCompleted && after.notesCompleted) {
      const r = await this.awardXp(userId, 'NOTES_READ', moduleId);
      xpEarned += r.xpEarned;
    }
    if (!before.quizPassed && after.quizPassed) {
      const r = await this.awardXp(userId, 'QUIZ_PASSED', moduleId);
      xpEarned += r.xpEarned;
    }

    if (!before.completed && after.completed) {
      const achievements = await this.checkAchievements(userId, { moduleTitle, courseId });
      newAchievements.push(...achievements);
      const courseReward = await this.checkCourseComplete(userId, courseId);
      xpEarned += courseReward.xpEarned;
    }

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { totalXp: true } });
    const level = getCadetLevel(updated.totalXp);
    return {
      xpEarned,
      totalXp: updated.totalXp,
      level,
      levelUp: level.tier > prevLevel.tier,
      newAchievements,
    };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXp: true,
        achievements: {
          orderBy: { earnedAt: 'desc' },
          include: { achievement: { select: { code: true, title: true, description: true, icon: true } } },
        },
        xpTransactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!user) return null;

    const allAchievements = await prisma.achievement.findMany({ orderBy: { code: 'asc' } });
    const earnedCodes = new Set(user.achievements.map((a) => a.achievement.code));

    return {
      totalXp: user.totalXp,
      level: getCadetLevel(user.totalXp),
      recentXp: user.xpTransactions.map((t) => ({
        action: t.action,
        amount: t.amount,
        at: t.createdAt,
      })),
      achievements: allAchievements.map((a) => ({
        code: a.code,
        title: a.title,
        description: a.description,
        icon: a.icon,
        earned: earnedCodes.has(a.code),
        earnedAt: user.achievements.find((ua) => ua.achievementId === a.id)?.earnedAt ?? null,
      })),
    };
  },
};
