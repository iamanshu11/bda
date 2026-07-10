import { LEVEL_TIERS } from '@/constants/gamification';

export interface CadetLevel {
  name: string;
  tier: number;
  min: number;
  next: number | null;
  icon: string;
  progressToNext: number;
}

/** Derive rank/level from total XP earned. */
export function getCadetLevel(totalXp: number): CadetLevel {
  let idx = 0;
  for (let i = 0; i < LEVEL_TIERS.length; i += 1) {
    if (totalXp >= LEVEL_TIERS[i].min) idx = i;
  }
  const current = LEVEL_TIERS[idx];
  const nextTier = LEVEL_TIERS[idx + 1] ?? null;
  const next = nextTier ? nextTier.min : null;

  let progressToNext = 100;
  if (nextTier) {
    const span = nextTier.min - current.min;
    progressToNext = Math.min(100, Math.round(((totalXp - current.min) / span) * 100));
  }

  return {
    name: current.name,
    tier: idx + 1,
    min: current.min,
    next,
    icon: current.icon,
    progressToNext,
  };
}

/** @deprecated Use getCadetLevel(totalXp) — kept for backwards compatibility during migration. */
export function getCadetRank(completedModules: number) {
  const estimatedXp = completedModules * 35;
  return getCadetLevel(estimatedXp);
}
