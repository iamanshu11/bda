'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Medal, Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

type Period = 'daily' | 'weekly' | 'monthly' | 'all';

interface Entry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  totalXp: number;
  level: { name: string; tier: number };
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [courseId, setCourseId] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', period, courseId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (courseId) params.set('courseId', courseId);
      return (await api.get(`/students/leaderboard?${params}`)).data.data as { entries: Entry[] };
    },
  });

  const { data: myRank } = useQuery({
    queryKey: ['leaderboard-me', period, courseId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (courseId) params.set('courseId', courseId);
      return (await api.get(`/students/leaderboard/me?${params}`)).data.data as { rank: number | null; score: number };
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => (await api.get('/students/courses')).data.data as { course: { id: string; title: string } }[],
  });

  const periods: { id: Period; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Leaderboard</h2>
        <p className="text-sm text-muted">Compete with fellow cadets by earning XP.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${period === p.id ? 'bg-navy-600 text-white' : 'bg-surface-alt text-muted hover:text-foreground'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <select
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
      >
        <option value="">All courses</option>
        {courses?.map((e) => (
          <option key={e.course.id} value={e.course.id}>{e.course.title}</option>
        ))}
      </select>

      {myRank && (
        <div className="rounded-xl border border-rust-200 bg-rust-50/50 p-4 dark:border-rust-800 dark:bg-rust-950/20">
          <p className="text-sm text-muted">Your rank</p>
          <p className="font-heading text-xl font-bold text-foreground">
            {myRank.rank ? `#${myRank.rank}` : 'Unranked'} · {myRank.score} XP
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : isError || !data ? (
        <p className="text-muted">Could not load leaderboard.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Cadet</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3 text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((e) => (
                <tr
                  key={e.userId}
                  className={`border-t border-border ${e.userId === user?.id ? 'bg-navy-50/50 dark:bg-navy-900/20' : ''}`}
                >
                  <td className="px-4 py-3 font-bold">
                    {e.rank <= 3 ? <Trophy size={16} className={e.rank === 1 ? 'text-yellow-500' : e.rank === 2 ? 'text-gray-400' : 'text-amber-700'} /> : `#${e.rank}`}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 text-muted">{e.level.name}</td>
                  <td className="px-4 py-3 text-right font-semibold">{e.score}</td>
                </tr>
              ))}
              {data.entries.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No activity yet for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
