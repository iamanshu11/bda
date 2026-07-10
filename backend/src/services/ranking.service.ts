import { prisma } from '@/config/prisma';
import { getCadetLevel } from '@/helpers/cadetRank';

export type RankingScope = 'overall' | 'subject' | 'academy' | 'state';

async function rankedStudents(
  where: Record<string, unknown>,
  scoreField: 'totalXp' | 'periodXp',
  periodXpMap?: Map<string, number>,
) {
  const users = await prisma.user.findMany({
    where: { ...where, role: { name: 'STUDENT' }, isActive: true },
    select: { id: true, name: true, avatarUrl: true, totalXp: true, state: true, academyId: true },
    orderBy: { totalXp: 'desc' },
    take: 100,
  });

  const sorted =
    scoreField === 'periodXp' && periodXpMap
      ? [...users].sort((a, b) => (periodXpMap.get(b.id) ?? 0) - (periodXpMap.get(a.id) ?? 0))
      : users;

  return sorted.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    name: u.name,
    avatarUrl: u.avatarUrl,
    score: scoreField === 'periodXp' ? (periodXpMap?.get(u.id) ?? 0) : u.totalXp,
    totalXp: u.totalXp,
    level: getCadetLevel(u.totalXp),
    state: u.state,
  }));
}

export const rankingService = {
  async get(userId: string, scope: RankingScope, categoryId?: string) {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, totalXp: true, state: true, academyId: true },
    });
    if (!me) return null;

    let entries: Awaited<ReturnType<typeof rankedStudents>> = [];
    let label = 'Overall';

    if (scope === 'overall') {
      entries = await rankedStudents({}, 'totalXp');
      label = 'Overall Academy Rank';
    } else if (scope === 'subject' && categoryId) {
      const cat = await prisma.courseCategory.findUnique({ where: { id: categoryId } });
      label = cat ? `${cat.name} Rank` : 'Subject Rank';
      const courses = await prisma.course.findMany({ where: { categoryId }, select: { id: true } });
      const courseIds = courses.map((c) => c.id);
      const modules = await prisma.courseModule.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true },
      });
      const moduleIds = modules.map((m) => m.id);
      const txs = await prisma.xpTransaction.findMany({
        where: { referenceId: { in: [...moduleIds, ...courseIds] } },
        select: { userId: true, amount: true },
      });
      const xpMap = new Map<string, number>();
      for (const t of txs) xpMap.set(t.userId, (xpMap.get(t.userId) ?? 0) + t.amount);
      const userIds = [...xpMap.keys()];
      entries = await rankedStudents({ id: { in: userIds } }, 'periodXp', xpMap);
    } else if (scope === 'academy' && me.academyId) {
      const academy = await prisma.academy.findUnique({ where: { id: me.academyId } });
      label = academy ? `${academy.name} Rank` : 'Academy Rank';
      entries = await rankedStudents({ academyId: me.academyId }, 'totalXp');
    } else if (scope === 'state' && me.state) {
      label = `${me.state} State Rank`;
      entries = await rankedStudents({ state: me.state }, 'totalXp');
    }

    const myEntry = entries.find((e) => e.userId === userId);
    const myRank = myEntry?.rank ?? null;

    return {
      scope,
      label,
      categoryId: categoryId ?? null,
      myRank,
      myScore: myEntry?.score ?? me.totalXp,
      totalCadets: entries.length,
      entries: entries.slice(0, 20),
      level: getCadetLevel(me.totalXp),
    };
  },

  async summary(userId: string) {
    const [overall, user] = await Promise.all([
      this.get(userId, 'overall'),
      prisma.user.findUnique({
        where: { id: userId },
        select: { academyId: true, state: true },
      }),
    ]);
    const subjectCats = await prisma.courseCategory.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
    const subjectRanks = await Promise.all(
      subjectCats.map(async (c) => {
        const r = await this.get(userId, 'subject', c.id);
        return { categoryId: c.id, name: c.name, slug: c.slug, myRank: r?.myRank ?? null };
      }),
    );

    const academyRank = user?.academyId ? await this.get(userId, 'academy') : null;
    const stateRank = user?.state ? await this.get(userId, 'state') : null;

    return {
      overall: { myRank: overall?.myRank ?? null, myScore: overall?.myScore ?? 0 },
      subject: subjectRanks,
      academy: academyRank ? { myRank: academyRank.myRank, label: academyRank.label } : null,
      state: stateRank ? { myRank: stateRank.myRank, label: stateRank.label } : null,
    };
  },
};
