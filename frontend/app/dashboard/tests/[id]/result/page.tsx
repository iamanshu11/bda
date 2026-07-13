'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type Opt = 'A' | 'B' | 'C' | 'D';

interface ResultData {
  score: number | null;
  totalMarks: number | null;
  correct: number | null;
  wrong: number | null;
  passed: boolean | null;
  cheatingCount: number;
  autoSubmitted: boolean;
  autoSubmitReason: string | null;
  submittedAt: string | null;
  answersRevealAt: string | null;
  revealed: boolean;
  review: null | {
    questionId: string;
    selected: Opt | null;
    correctOption: Opt;
    isCorrect: boolean;
    explanation: string | null;
    question?: string;
    options?: Record<Opt, string> | null;
  }[];
}

export default function TestResultPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['test-result', id],
    queryFn: async () => (await api.get(`/students/tests/${id}/result`)).data.data as ResultData,
    refetchInterval: (q) => (q.state.data && !q.state.data.revealed ? 60_000 : false),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-navy-500" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-muted">Could not load result. Make sure you have submitted the test.</p>
        <Button href="/dashboard/tests" className="mt-4" variant="outline">
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">Exam result</h1>
        <p className="mt-4 font-heading text-4xl font-extrabold text-navy-600 dark:text-navy-200">
          {data.score ?? 0}
          <span className="text-lg font-medium text-muted"> / {data.totalMarks ?? 0}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Correct: {data.correct ?? 0} · Wrong: {data.wrong ?? 0}
        </p>
        {data.passed != null && (
          <p className={cn('mt-2 font-semibold', data.passed ? 'text-green-600' : 'text-rust-500')}>
            {data.passed ? 'Passed' : 'Not passed'}
          </p>
        )}
        {data.autoSubmitted && (
          <p className="mt-3 text-sm text-rust-600">
            Auto-submitted{data.autoSubmitReason ? ` (${data.autoSubmitReason.replace(/_/g, ' ')})` : ''}.
          </p>
        )}
        {data.cheatingCount > 0 && (
          <p className="mt-1 text-xs text-muted">Cheating attempts logged: {data.cheatingCount}</p>
        )}
        {data.submittedAt && (
          <p className="mt-1 text-xs text-muted">
            Submitted {new Date(data.submittedAt).toLocaleString('en-IN')}
          </p>
        )}
      </div>

      {!data.revealed ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-center text-sm text-muted">
          Correct answers and explanations will be released
          {data.answersRevealAt
            ? ` on ${new Date(data.answersRevealAt).toLocaleString('en-IN')}`
            : ' soon'}
          . This page refreshes automatically when they are available.
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-foreground">Answer review</h2>
          {(data.review ?? []).map((r, i) => (
            <div key={r.questionId} className="rounded-xl border border-border bg-surface p-4">
              <p className="flex items-start gap-2 font-medium text-foreground">
                {r.isCorrect ? (
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                ) : (
                  <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                )}
                {i + 1}. {r.question}
              </p>
              {r.options && (
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  {(['A', 'B', 'C', 'D'] as Opt[]).map((opt) => (
                    <li
                      key={opt}
                      className={cn(
                        opt === r.correctOption && 'font-semibold text-green-700 dark:text-green-300',
                        opt === r.selected && opt !== r.correctOption && 'text-red-600',
                      )}
                    >
                      {opt}. {r.options![opt]}
                      {opt === r.correctOption ? ' ✓' : ''}
                      {opt === r.selected && opt !== r.correctOption ? ' (your answer)' : ''}
                    </li>
                  ))}
                </ul>
              )}
              {r.explanation && <p className="mt-2 text-xs text-muted">{r.explanation}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button href="/dashboard/tests" variant="outline">
          My tests
        </Button>
        <Link href="/tests" className="text-sm font-semibold text-navy-600 hover:underline self-center">
          Browse more tests
        </Link>
      </div>
    </div>
  );
}
