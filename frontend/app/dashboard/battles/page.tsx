'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Swords, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Battle {
  id: string;
  title: string;
  description: string | null;
  status: string;
  course: string | null;
  category: string | null;
  playerCount: number;
  questionCount: number;
  xpRewardWinner: number;
  joined: boolean;
}

export default function BattlesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['battles'],
    queryFn: async () => (await api.get('/students/battles')).data.data as Battle[],
  });

  const { data: history } = useQuery({
    queryKey: ['battles-history'],
    queryFn: async () =>
      (await api.get('/students/battles/history')).data.data as {
        battleId: string;
        title: string;
        score: number;
        rank: number | null;
        xpEarned: number;
        endedAt: string | null;
      }[],
  });

  const join = useMutation({
    mutationFn: (id: string) => api.post(`/students/battles/${id}/join`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['battles'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Live Quiz Battles</h2>
        <p className="text-sm text-muted">Join a battle, answer fast, climb the live ranking, and win XP rewards.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : !data?.length ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">No battles available right now. Check back soon!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((b) => (
            <div key={b.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading text-lg font-bold text-foreground">{b.title}</h3>
                  {b.description && <p className="mt-1 text-sm text-muted">{b.description}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${b.status === 'LIVE' ? 'bg-green-100 text-green-700' : 'bg-navy-100 text-navy-700'}`}>
                  {b.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                {b.category && <span>{b.category}</span>}
                <span className="inline-flex items-center gap-1"><Users size={12} />{b.playerCount} cadets</span>
                <span>{b.questionCount} questions</span>
                <span>🏆 +{b.xpRewardWinner} XP winner</span>
              </div>
              <div className="mt-4 flex gap-2">
                {!b.joined ? (
                  <Button size="sm" onClick={() => join.mutate(b.id)} disabled={join.isPending}>
                    {join.isPending ? <Loader2 className="animate-spin" size={14} /> : <><Swords size={14} /> Join Battle</>}
                  </Button>
                ) : (
                  <Button size="sm" href={`/dashboard/battles/${b.id}`}>
                    {b.status === 'LIVE' ? 'Enter Battle' : 'Go to Lobby'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {history && history.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-heading text-lg font-bold text-foreground">Recent Battles</h3>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.battleId} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                <span className="font-medium">{h.title}</span>
                <span className="text-muted">#{h.rank ?? '—'} · {h.score} pts</span>
                {h.xpEarned > 0 && <span className="font-semibold text-rust-600">+{h.xpEarned} XP</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
