'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';

interface AttemptRow {
  id: string;
  status: string;
  cheatingCount: number;
  maxCheatingAttempts: number;
  currentQuestionIndex: number | null;
  lastHeartbeatAt: string | null;
  endsAt: string | null;
  clientIp: string | null;
  userAgent: string | null;
  online: boolean;
  user: { name: string; email: string };
  test: { id: string; title: string };
  recentViolations: { type: string; createdAt: string }[];
}

export default function ExamMonitoringPage() {
  const qc = useQueryClient();
  const [testId, setTestId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: tests } = useQuery({
    queryKey: ['admin-written-tests-list'],
    queryFn: async () =>
      (await api.get('/admin/written-tests', { params: { limit: 100 } })).data.data as {
        id: string;
        title: string;
      }[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['exam-monitoring', testId],
    queryFn: async () =>
      (
        await api.get('/admin/exam-monitoring', {
          params: { testId: testId || undefined, status: 'IN_PROGRESS' },
        })
      ).data.data as AttemptRow[],
    refetchInterval: 5000,
  });

  const force = useMutation({
    mutationFn: (id: string) => api.post(`/admin/exam-attempts/${id}/force-submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exam-monitoring'] }),
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground sm:text-2xl">
            <ShieldAlert className="shrink-0 text-rust-500" />
            <span className="truncate">Exam Monitoring</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Live attempts refresh every 5 seconds.</p>
        </div>
        <label className="w-full text-sm sm:w-auto sm:min-w-[14rem]">
          <span className="mb-1 block text-muted">Filter by test</span>
          <select
            className="min-h-10 w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-500"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
          >
            <option value="">All in-progress</option>
            {(tests ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <Loader2 className="animate-spin text-navy-500" />
      ) : !data?.length ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-muted">No live exam sessions.</p>
      ) : (
        <div className="grid gap-4">
          {data.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-bold text-foreground">{a.user.name}</p>
                  <p className="text-xs text-muted">{a.user.email}</p>
                  <p className="mt-1 text-sm text-foreground">{a.test.title}</p>
                </div>
                <div className="text-right text-sm">
                  <p className={a.online ? 'text-green-600' : 'text-rust-500'}>
                    {a.online ? 'Online' : 'Offline / stale heartbeat'}
                  </p>
                  <p className="text-muted">
                    Cheats: {a.cheatingCount}/{a.maxCheatingAttempts}
                  </p>
                  <p className="text-muted">Q#: {(a.currentQuestionIndex ?? 0) + 1}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
                <p>IP: {a.clientIp ?? '—'}</p>
                <p className="truncate">UA: {a.userAgent ?? '—'}</p>
                <p>Ends: {a.endsAt ? new Date(a.endsAt).toLocaleString('en-IN') : 'No limit'}</p>
                <p>
                  Last beat:{' '}
                  {a.lastHeartbeatAt ? new Date(a.lastHeartbeatAt).toLocaleTimeString('en-IN') : '—'}
                </p>
              </div>
              {a.recentViolations.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-rust-600">
                  {a.recentViolations.map((v, i) => (
                    <li key={i}>
                      {v.type} · {new Date(v.createdAt).toLocaleTimeString('en-IN')}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  disabled={force.isPending}
                  onClick={() => force.mutate(a.id)}
                >
                  Force submit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
