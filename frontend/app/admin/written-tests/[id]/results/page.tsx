'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Row {
  rank: number;
  name: string;
  email: string;
  score: number | null;
  totalMarks: number | null;
  correct: number | null;
  wrong: number | null;
  cheatingCount: number;
  autoSubmitted: boolean;
  submittedAt: string | null;
}

export default function AdminTestResultsPage() {
  const params = useParams();
  const id = String(params.id);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-test-results', id],
    queryFn: async () => (await api.get(`/admin/written-tests/${id}/results`)).data.data as Row[],
  });

  return (
    <div className="space-y-4">
      <Link href="/admin/written-tests" className="text-sm text-navy-600 hover:underline">
        ← Back to written tests
      </Link>
      <h1 className="font-heading text-2xl font-bold text-foreground">Test results</h1>
      {isLoading ? (
        <Loader2 className="animate-spin text-navy-500" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-alt text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Rank</th>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">C/W</th>
                <th className="px-3 py-2">Cheats</th>
                <th className="px-3 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={`${r.rank}-${r.email}`} className="border-t border-border">
                  <td className="px-3 py-2">{r.rank}</td>
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted">{r.email}</p>
                  </td>
                  <td className="px-3 py-2">
                    {r.score}/{r.totalMarks}
                  </td>
                  <td className="px-3 py-2">
                    {r.correct}/{r.wrong}
                  </td>
                  <td className="px-3 py-2">{r.cheatingCount}{r.autoSubmitted ? ' (auto)' : ''}</td>
                  <td className="px-3 py-2 text-xs text-muted">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
