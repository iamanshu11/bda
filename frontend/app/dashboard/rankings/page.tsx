'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Medal, MapPin, School } from 'lucide-react';
import { api } from '@/lib/api';

type Scope = 'overall' | 'subject' | 'academy' | 'state';

interface RankEntry {
  rank: number;
  userId: string;
  name: string;
  score: number;
  level: { name: string };
}

export default function RankingsPage() {
  const [scope, setScope] = useState<Scope>('overall');
  const [categoryId, setCategoryId] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['rankings-summary'],
    queryFn: async () => (await api.get('/students/rankings/summary')).data.data,
  });

  useEffect(() => {
    if (scope === 'subject' && !categoryId && summary?.subject?.length) {
      setCategoryId(summary.subject[0].categoryId);
    }
  }, [scope, categoryId, summary]);

  const { data, isLoading } = useQuery({
    queryKey: ['rankings', scope, categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ scope });
      if (scope === 'subject' && categoryId) params.set('categoryId', categoryId);
      return (await api.get(`/students/rankings?${params}`)).data.data as {
        label: string;
        myRank: number | null;
        myScore: number;
        entries: RankEntry[];
      };
    },
    enabled: scope !== 'subject' || Boolean(categoryId),
  });

  const scopes: { id: Scope; label: string; icon: React.ReactNode }[] = [
    { id: 'overall', label: 'Overall', icon: <Medal size={16} /> },
    { id: 'subject', label: 'Subject', icon: <School size={16} /> },
    { id: 'academy', label: 'Academy', icon: <School size={16} /> },
    { id: 'state', label: 'State', icon: <MapPin size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Rankings</h2>
        <p className="text-sm text-muted">See where you stand across different scopes.</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-muted">Overall</p>
            <p className="font-heading text-2xl font-bold">{summary.overall.myRank ? `#${summary.overall.myRank}` : '—'}</p>
          </div>
          {summary.academy && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">Academy</p>
              <p className="font-heading text-2xl font-bold">{summary.academy.myRank ? `#${summary.academy.myRank}` : '—'}</p>
            </div>
          )}
          {summary.state && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs text-muted">State</p>
              <p className="font-heading text-2xl font-bold">{summary.state.myRank ? `#${summary.state.myRank}` : '—'}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {scopes.map((s) => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${scope === s.id ? 'bg-navy-600 text-white' : 'bg-surface-alt text-muted'}`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {scope === 'subject' && summary?.subject && (
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">Select subject</option>
          {summary.subject.map((s: { categoryId: string; name: string }) => (
            <option key={s.categoryId} value={s.categoryId}>{s.name}</option>
          ))}
        </select>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>
      ) : data ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-rust-200 bg-rust-50/50 p-4 dark:border-rust-800">
            <p className="font-semibold text-foreground">{data.label}</p>
            <p className="text-sm text-muted">Your rank: {data.myRank ? `#${data.myRank}` : 'Unranked'} · {data.myScore} XP</p>
          </div>
          <ul className="space-y-2">
            {data.entries.map((e) => (
              <li key={e.userId} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                <span className="font-bold text-muted w-8">#{e.rank}</span>
                <span className="flex-1 font-medium">{e.name}</span>
                <span className="text-sm text-muted">{e.level.name}</span>
                <span className="font-semibold w-16 text-right">{e.score}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
