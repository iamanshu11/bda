'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';

type Opt = 'A' | 'B' | 'C' | 'D';

interface Question {
  id: string;
  question: string;
  options: Record<Opt, string>;
}

interface Quiz {
  id: string;
  passingMarks: number;
  totalQuestions: number;
  questions: Question[];
}

interface ReviewItem {
  questionId: string;
  selected: Opt | null;
  correctOption: Opt;
  isCorrect: boolean;
  explanation: string | null;
}

interface Result {
  score: number;
  total: number;
  passingMarks: number;
  passed: boolean;
  review: ReviewItem[];
  gamification?: { xpEarned?: number; levelUp?: boolean; level?: { name: string }; newAchievements?: { title: string }[] };
}

export function QuizTaker({
  moduleId,
  quiz,
  disabled,
  onPassed,
  onReward,
}: {
  moduleId: string;
  quiz: Quiz;
  disabled: boolean;
  onPassed: () => void;
  onReward?: (g: Result['gamification']) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, Opt>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      const payload = { answers: Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected })) };
      return (await api.post(`/students/modules/${moduleId}/quiz/submit`, payload)).data.data as Result;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.gamification) onReward?.(data.gamification);
      if (data.passed) onPassed();
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  function reset() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  const reviewMap = new Map(result?.review.map((r) => [r.questionId, r]));

  return (
    <div className={cn('rounded-xl border border-border bg-surface p-6', disabled && 'opacity-60')}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Assessment <span className="text-sm font-normal text-muted">· pass {quiz.passingMarks}/{quiz.totalQuestions}</span>
        </h3>
        {result && (
          <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', result.passed ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300')}>
            {result.score}/{result.total} · {result.passed ? 'Passed' : 'Failed'}
          </span>
        )}
      </div>

      {disabled && !result && (
        <p className="mb-4 rounded-md bg-surface-alt p-3 text-sm text-muted">
          Watch the video and read the notes to unlock the quiz.
        </p>
      )}

      <ol className="space-y-5">
        {quiz.questions.map((q, i) => {
          const rev = reviewMap.get(q.id);
          return (
            <li key={q.id}>
              <p className="mb-2 font-medium text-foreground">{i + 1}. {q.question}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(['A', 'B', 'C', 'D'] as Opt[]).map((opt) => {
                  const selected = answers[q.id] === opt;
                  let state = '';
                  if (rev) {
                    if (opt === rev.correctOption) state = 'border-green-500 bg-green-50 dark:bg-green-950/30';
                    else if (opt === rev.selected) state = 'border-red-500 bg-red-50 dark:bg-red-950/30';
                  } else if (selected) {
                    state = 'border-navy-500 bg-navy-50 dark:bg-navy-900/40';
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled || !!result}
                      onClick={() => setAnswers((s) => ({ ...s, [q.id]: opt }))}
                      className={cn('flex items-start gap-2 rounded-md border border-border p-2.5 text-left text-sm transition-colors', state, !result && !disabled && 'hover:border-navy-400')}
                    >
                      <span className="font-bold">{opt}.</span> <span>{q.options[opt]}</span>
                    </button>
                  );
                })}
              </div>
              {rev?.explanation && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                  {rev.isCorrect ? <CheckCircle2 size={14} className="mt-0.5 text-green-600" /> : <XCircle size={14} className="mt-0.5 text-red-600" />}
                  {rev.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        {!result ? (
          <Button onClick={() => { setError(null); submit.mutate(); }} disabled={disabled || !allAnswered || submit.isPending}>
            {submit.isPending ? <><Loader2 className="animate-spin" size={16} /> Submitting…</> : 'Submit quiz'}
          </Button>
        ) : result.passed ? (
          <Button onClick={onPassed}>Continue to next operation <ArrowRight size={16} /></Button>
        ) : (
          <Button variant="secondary" onClick={reset}>Retake quiz</Button>
        )}
        {!result && !allAnswered && <span className="text-sm text-muted">Answer all questions to submit.</span>}
      </div>
    </div>
  );
}
