import { prisma } from '@/config/prisma';
import { getCadetLevel } from '@/helpers/cadetRank';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

function periodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  if (period === 'all') return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === 'daily') return d;
  if (period === 'weekly') {
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'monthly') {
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  return d;
}

async function courseModuleIds(courseId: string) {
  const mods = await prisma.courseModule.findMany({ where: { courseId }, select: { id: true } });
  return mods.map((m) => m.id);
}

export const leaderboardService = {
  /** XP leaderboard for a time period, optionally scoped to a course. */
  async list(period: LeaderboardPeriod, opts?: { courseId?: string; limit?: number }) {
    const limit = opts?.limit ?? 50;
    const since = periodStart(period);
    const courseId = opts?.courseId;

    let moduleIds: string[] | null = null;
    if (courseId) moduleIds = await courseModuleIds(courseId);

    const txs = await prisma.xpTransaction.findMany({
      where: {
        ...(since ? { createdAt: { gte: since } } : {}),
        ...(courseId && moduleIds
          ? {
              OR: [
                { referenceId: { in: moduleIds } },
                { action: 'COURSE_COMPLETED', referenceId: courseId },
              ],
            }
          : {}),
      },
      select: { userId: true, amount: true },
    });

    const scores = new Map<string, number>();
    for (const t of txs) scores.set(t.userId, (scores.get(t.userId) ?? 0) + t.amount);

    const userIds = [...scores.keys()];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, role: { name: 'STUDENT' } },
      select: { id: true, name: true, avatarUrl: true, totalXp: true },
    });

    const rows = users
      .map((u) => ({
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        score: scores.get(u.id) ?? 0,
        totalXp: u.totalXp,
        level: getCadetLevel(u.totalXp),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r, i) => ({ rank: i + 1, ...r }));

    return { period, courseId: courseId ?? null, entries: rows };
  },

  async myRank(userId: string, period: LeaderboardPeriod, courseId?: string) {
    const full = await this.list(period, { courseId, limit: 500 });
    const me = full.entries.find((e) => e.userId === userId);
    return {
      period,
      courseId: courseId ?? null,
      rank: me?.rank ?? null,
      score: me?.score ?? 0,
      total: full.entries.length,
    };
  },
};
