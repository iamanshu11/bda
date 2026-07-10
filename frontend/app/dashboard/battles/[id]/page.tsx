'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Trophy } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { XpToast, type GamificationPayload } from '@/components/gamification/XpToast';

type Opt = 'A' | 'B' | 'C' | 'D';

interface LiveState {
  id: string;
  title: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemainingMs: number;
  currentQuestion: {
    id: string;
    question: string;
    options: Record<Opt, string>;
    answered: boolean;
  } | null;
  leaderboard: { rank: number; name: string; score: number; userId: string }[];
  myParticipant: { score: number; rank: number | null; xpEarned: number; finished: boolean } | null;
  winner: { name: string; score: number } | null;
}

export default function BattleRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Opt | null>(null);
  const [xpToast, setXpToast] = useState<GamificationPayload | null>(null);
  const questionStart = useRef(Date.now());

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['battle-live', id],
    queryFn: async () => (await api.get(`/students/battles/${id}/live`)).data.data as LiveState,
    refetchInterval: (q) => (q.state.data?.status === 'LIVE' ? 2000 : false),
  });

  useEffect(() => {
    if (data?.currentQuestion && !data.currentQuestion.answered) {
      questionStart.current = Date.now();
      setSelected(null);
    }
  }, [data?.currentQuestion?.id, data?.currentQuestion?.answered]);

  const start = useMutation({
    mutationFn: () => api.post(`/students/battles/${id}/start`),
    onSuccess: () => refetch(),
  });

  const answer = useMutation({
    mutationFn: (opt: Opt) =>
      api.post(`/students/battles/${id}/answer`, {
        questionId: data!.currentQuestion!.id,
        selected: opt,
        timeMs: Date.now() - questionStart.current,
      }),
    onSuccess: () => {
      refetch();
      qc.invalidateQueries({ queryKey: ['command-center'] });
    },
  });

  if (isLoading || !data) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-navy-500" size={32} /></div>;
  }

  if (data.status === 'FINISHED') {
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <Trophy size={48} className="mx-auto text-yellow-500" />
        <h2 className="font-heading text-2xl font-bold">Battle Complete!</h2>
        {data.winner && <p className="text-muted">Winner: <strong>{data.winner.name}</strong> ({data.winner.score} pts)</p>}
        {data.myParticipant && (
          <p className="text-lg">Your score: <strong>{data.myParticipant.score}</strong>
            {data.myParticipant.xpEarned > 0 && ` · +${data.myParticipant.xpEarned} XP`}
          </p>
        )}
        <Button href="/dashboard/battles">Back to Battles</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <XpToast reward={xpToast} onDone={() => setXpToast(null)} />

      <div>
        <Link href="/dashboard/battles" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={14} /> All battles
        </Link>
        <h2 className="font-heading text-2xl font-bold">{data.title}</h2>
        <p className="text-sm text-muted capitalize">{data.status.toLowerCase()} · Q{data.currentQuestionIndex + 1}/{data.totalQuestions}</p>

        {data.status === 'LOBBY' && (
          <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-muted">Waiting in the lobby. Start when ready!</p>
            <Button className="mt-4" onClick={() => start.mutate()} disabled={start.isPending}>
              {start.isPending ? <Loader2 className="animate-spin" size={16} /> : 'Start Battle'}
            </Button>
          </div>
        )}

        {data.status === 'LIVE' && data.currentQuestion && (
          <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-rust-600">Time: {Math.ceil(data.timeRemainingMs / 1000)}s</span>
              <span className="text-muted">Your score: {data.myParticipant?.score ?? 0}</span>
            </div>
            <p className="font-heading text-lg font-bold">{data.currentQuestion.question}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['A', 'B', 'C', 'D'] as Opt[]).map((opt) => (
                <button
                  key={opt}
                  disabled={data.currentQuestion!.answered || answer.isPending}
                  onClick={() => { setSelected(opt); answer.mutate(opt); }}
                  className={cn(
                    'rounded-lg border border-border p-3 text-left text-sm transition-colors',
                    selected === opt && 'border-navy-500 bg-navy-50 dark:bg-navy-900/30',
                    data.currentQuestion!.answered && 'opacity-60',
                  )}
                >
                  <span className="font-bold">{opt}.</span> {data.currentQuestion!.options[opt]}
                </button>
              ))}
            </div>
            {data.currentQuestion.answered && (
              <p className="text-sm text-green-600">Answer submitted — waiting for next question…</p>
            )}
          </div>
        )}
      </div>

      {/* Live ranking sidebar */}
      <aside className="rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-24">
        <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-navy-600">Live Ranking</h3>
        <ol className="space-y-2">
          {data.leaderboard.map((p) => (
            <li key={p.userId} className="flex items-center justify-between text-sm">
              <span><span className="font-bold text-muted">#{p.rank}</span> {p.name}</span>
              <span className="font-semibold">{p.score}</span>
            </li>
          ))}
          {data.leaderboard.length === 0 && <p className="text-sm text-muted">No players yet.</p>}
        </ol>
      </aside>
    </div>
  );
}
