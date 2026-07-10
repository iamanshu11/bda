'use client';

import { useEffect } from 'react';
import { Sparkles, Trophy } from 'lucide-react';

export interface GamificationPayload {
  xpEarned?: number;
  levelUp?: boolean;
  level?: { name: string };
  newAchievements?: { title: string }[];
}

export function XpToast({ reward, onDone }: { reward: GamificationPayload | null; onDone: () => void }) {
  useEffect(() => {
    if (!reward?.xpEarned && !reward?.levelUp && !reward?.newAchievements?.length) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [reward, onDone]);

  if (!reward || (!reward.xpEarned && !reward.levelUp && !reward.newAchievements?.length)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border border-rust-200 bg-surface p-4 shadow-lg dark:border-rust-800">
      {reward.xpEarned ? (
        <p className="flex items-center gap-2 font-semibold text-rust-600 dark:text-rust-300">
          <Sparkles size={18} /> +{reward.xpEarned} XP earned
        </p>
      ) : null}
      {reward.levelUp && reward.level ? (
        <p className="mt-1 text-sm font-medium text-navy-600 dark:text-navy-200">
          Promoted to {reward.level.name}! 🎖️
        </p>
      ) : null}
      {reward.newAchievements?.map((a) => (
        <p key={a.title} className="mt-1 flex items-center gap-1.5 text-sm text-foreground">
          <Trophy size={14} className="text-rust-500" /> {a.title}
        </p>
      ))}
    </div>
  );
}
