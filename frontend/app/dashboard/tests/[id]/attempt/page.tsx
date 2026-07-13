'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import {
  SecureExamShell,
  clearExamSessionFlag,
  enterExamFullscreen,
  type ViolationType,
} from '@/components/exam/SecureExamShell';

type Opt = 'A' | 'B' | 'C' | 'D';

interface Question {
  id: string;
  question: string;
  options: Record<Opt, string>;
  marks: number;
  order: number;
}

interface StartPayload {
  attemptId: string;
  sessionToken: string;
  startedAt: string;
  endsAt: string | null;
  cheatingCount: number;
  maxCheatingAttempts: number;
  offlineAutoSubmitMins: number | null;
  answers: { questionId: string; selected: Opt }[];
  currentQuestionIndex: number;
  questions: Question[];
  test: {
    id: string;
    title: string;
    instructions?: string | null;
    durationMins?: number | null;
    totalQuestions: number;
    marksPerQuestion: number;
    negativeMark: number;
    passingMarks?: number | null;
  };
  resumed: boolean;
}

const STORAGE_KEY = (testId: string) => `bda-exam-answers-${testId}`;

export default function SecureExamAttemptPage() {
  const { id: testId } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<StartPayload | null>(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Opt>>({});
  const [cheatingCount, setCheatingCount] = useState(0);
  const [maxCheats, setMaxCheats] = useState(3);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(Date.now());
  const offlineSince = useRef<number | null>(null);
  const sessionTokenRef = useRef<string>('');
  const answersRef = useRef(answers);
  const qIndexRef = useRef(qIndex);
  const violationBusy = useRef(false);

  answersRef.current = answers;
  qIndexRef.current = qIndex;

  const persistLocal = useCallback(
    (map: Record<string, Opt>) => {
      try {
        localStorage.setItem(STORAGE_KEY(testId), JSON.stringify(map));
      } catch {
        /* ignore */
      }
    },
    [testId],
  );

  const answersPayload = useCallback(() => {
    return Object.entries(answersRef.current).map(([questionId, selected]) => ({
      questionId,
      selected,
    }));
  }, []);

  const finishAndRedirect = useCallback(() => {
    clearExamSessionFlag();
    try {
      localStorage.removeItem(STORAGE_KEY(testId));
    } catch {
      /* ignore */
    }
    router.replace(`/dashboard/tests/${testId}/result`);
  }, [router, testId]);

  const submitExam = useCallback(
    async (reason?: string) => {
      if (!sessionTokenRef.current || submitting) return;
      setSubmitting(true);
      try {
        await api.post(`/students/tests/${testId}/submit`, {
          sessionToken: sessionTokenRef.current,
          answers: answersPayload(),
          ...(reason ? { autoSubmitReason: reason } : {}),
        });
        finishAndRedirect();
      } catch (err) {
        setError(getApiErrorMessage(err));
        setSubmitting(false);
      }
    },
    [answersPayload, finishAndRedirect, submitting, testId],
  );

  const reportViolation = useCallback(
    async (type: ViolationType, metadata?: Record<string, unknown>) => {
      if (!sessionTokenRef.current || violationBusy.current || submitting) return;
      violationBusy.current = true;
      try {
        const res = await api.post(`/students/tests/${testId}/violations`, {
          type,
          sessionToken: sessionTokenRef.current,
          metadata,
        });
        const data = res.data.data as {
          cheatingCount: number;
          maxCheatingAttempts: number;
          autoSubmitted?: boolean;
          warning?: string;
        };
        setCheatingCount(data.cheatingCount);
        setMaxCheats(data.maxCheatingAttempts);
        if (data.warning) setWarning(data.warning);
        if (data.autoSubmitted) finishAndRedirect();
      } catch (err) {
        const msg = getApiErrorMessage(err);
        if (msg.toLowerCase().includes('invalid exam session')) {
          setError('Your exam session was taken over by another tab or device.');
        }
      } finally {
        violationBusy.current = false;
      }
    },
    [finishAndRedirect, submitting, testId],
  );

  // Start / resume attempt — fired ONCE from the user's "Start exam" click.
  // Gating this behind a real user gesture (a) lets fullscreen actually engage,
  // and (b) guarantees /start is POSTed exactly once (no StrictMode double-call).
  const beginExam = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarted(true);
    setLoading(true);
    setError(null);

    // Enter fullscreen from within the click gesture (best-effort).
    await enterExamFullscreen(document.documentElement);

    try {
      const res = await api.post(`/students/tests/${testId}/start`);
      const data = res.data.data as StartPayload;
      sessionTokenRef.current = data.sessionToken;
      setSession(data);
      setCheatingCount(data.cheatingCount);
      setMaxCheats(data.maxCheatingAttempts);
      setQIndex(data.currentQuestionIndex ?? 0);

      const map: Record<string, Opt> = {};
      for (const a of data.answers ?? []) map[a.questionId] = a.selected;
      try {
        const raw = localStorage.getItem(STORAGE_KEY(testId));
        if (raw) {
          const local = JSON.parse(raw) as Record<string, Opt>;
          Object.assign(map, local);
        }
      } catch {
        /* ignore */
      }
      setAnswers(map);
      if (data.resumed) {
        setWarning('Exam resumed. Your previous answers have been restored.');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      // Allow the student to retry if the start call failed.
      startedRef.current = false;
      setStarted(false);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  // Timer tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-submit when time expires
  useEffect(() => {
    if (!session?.endsAt || submitting) return;
    if (now >= new Date(session.endsAt).getTime()) {
      void submitExam('TIME_EXPIRED');
    }
  }, [now, session?.endsAt, submitExam, submitting]);

  // Heartbeat + offline save
  useEffect(() => {
    if (!session) return;
    const beat = async () => {
      try {
        await api.post(`/students/tests/${testId}/heartbeat`, {
          sessionToken: sessionTokenRef.current,
          currentQuestionIndex: qIndexRef.current,
          answers: answersPayload(),
          online: navigator.onLine,
        });
      } catch (err) {
        const msg = getApiErrorMessage(err);
        if (msg.toLowerCase().includes('invalid exam session')) {
          setError('Session invalidated (another tab/device).');
        } else if (msg.toLowerCase().includes('time expired')) {
          finishAndRedirect();
        }
      }
    };
    void beat();
    const id = setInterval(beat, 15000);
    return () => clearInterval(id);
  }, [answersPayload, finishAndRedirect, session, testId]);

  // Offline handling
  useEffect(() => {
    if (!session) return;
    const thresholdMins = session.offlineAutoSubmitMins ?? 5;
    const onOff = () => {
      offlineSince.current = Date.now();
      void reportViolation('OFFLINE');
    };
    const onOn = () => {
      const started = offlineSince.current;
      offlineSince.current = null;
      void api
        .post(`/students/tests/${testId}/answers`, {
          sessionToken: sessionTokenRef.current,
          answers: answersPayload(),
          currentQuestionIndex: qIndexRef.current,
        })
        .catch(() => undefined);
      if (started && Date.now() - started > thresholdMins * 60_000) {
        void submitExam('OFFLINE_TIMEOUT');
      }
    };
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOn);
    return () => {
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOn);
    };
  }, [answersPayload, reportViolation, session, submitExam, testId]);

  const remainingMs = useMemo(() => {
    if (!session?.endsAt) return null;
    return Math.max(0, new Date(session.endsAt).getTime() - now);
  }, [now, session?.endsAt]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  // Intro gate — the exam only begins when the student clicks "Start exam".
  // This is the user gesture that enables fullscreen and fires /start once.
  if (!started || (!session && !loading)) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Ready to begin?</h1>
        <p className="mt-2 text-sm text-muted">
          This is a proctored exam. Once you start, a timer begins and the following are recorded
          and may count as warnings: leaving this tab, switching apps, exiting full screen, copying,
          or opening developer tools. Repeated warnings can auto-submit your exam.
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          <li>• Stay in this tab and in full screen for the whole exam.</li>
          <li>• Keep a stable internet connection.</li>
          <li>• Do not refresh or close the window.</li>
        </ul>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex gap-3">
          <Button onClick={() => void beginExam()}>Start exam</Button>
          <Button href="/dashboard/tests" variant="outline">
            Back to My Tests
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-navy-500" size={32} />
      </div>
    );
  }

  const q = session.questions[qIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <SecureExamShell
      enabled={!submitting}
      onViolation={reportViolation}
      cheatingCount={cheatingCount}
      maxCheatingAttempts={maxCheats}
      warning={warning}
      onDismissWarning={() => setWarning(null)}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">{session.test.title}</h1>
          <p className="text-sm text-muted">
            Question {qIndex + 1} of {session.questions.length} · Answered {answeredCount}
            {' · '}+{session.test.marksPerQuestion} / −{session.test.negativeMark}
          </p>
        </div>
        <div className="text-right">
          {remainingMs != null && (
            <p className={cn('font-mono text-lg font-bold', remainingMs < 60_000 ? 'text-rust-500' : 'text-foreground')}>
              {formatTime(remainingMs)}
            </p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      {session.test.instructions && (
        <p className="mb-4 rounded-lg bg-surface-alt p-3 text-xs text-muted">{session.test.instructions}</p>
      )}

      {q && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="font-medium text-foreground">
            {qIndex + 1}. {q.question}{' '}
            <span className="text-xs text-muted">({q.marks} mark{q.marks === 1 ? '' : 's'})</span>
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(['A', 'B', 'C', 'D'] as Opt[]).map((opt) => {
              const selected = answers[q.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    const next = { ...answers, [q.id]: opt };
                    setAnswers(next);
                    persistLocal(next);
                  }}
                  className={cn(
                    'rounded-md border p-3 text-left text-sm transition-colors',
                    selected
                      ? 'border-navy-500 bg-navy-50 dark:bg-navy-900/40'
                      : 'border-border hover:border-navy-300',
                  )}
                >
                  <span className="font-bold">{opt}.</span> {q.options[opt]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={qIndex === 0 || submitting}
          onClick={() => setQIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>
        <div className="flex flex-wrap gap-1">
          {session.questions.map((qq, i) => (
            <button
              key={qq.id}
              type="button"
              onClick={() => setQIndex(i)}
              className={cn(
                'h-8 w-8 rounded text-xs font-semibold',
                i === qIndex
                  ? 'bg-navy-600 text-white'
                  : answers[qq.id]
                    ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                    : 'bg-surface-alt text-muted',
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {qIndex < session.questions.length - 1 ? (
          <Button size="sm" disabled={submitting} onClick={() => setQIndex((i) => i + 1)}>
            Next
          </Button>
        ) : (
          <Button size="sm" disabled={submitting} onClick={() => void submitExam()}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Submitting…
              </>
            ) : (
              'Submit exam'
            )}
          </Button>
        )}
      </div>
    </SecureExamShell>
  );
}
