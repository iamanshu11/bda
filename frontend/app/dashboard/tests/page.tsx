'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface EnrolledTest {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  durationMins?: number | null;
  totalQuestions: number;
  availableFrom: string;
  availableTo: string;
  enrolledAt: string;
  attempt: null | {
    id: string;
    status: string;
    score: number | null;
    cheatingCount: number;
    endsAt: string | null;
  };
}

interface AvailableTest {
  id: string;
  title: string;
  slug: string;
  price: number;
  totalQuestions: number;
  windowState: string;
}

export default function MyTestsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-tests'],
    queryFn: async () =>
      (await api.get('/students/tests')).data.data as {
        enrolled: EnrolledTest[];
        available: AvailableTest[];
      },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-navy-500" size={32} />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load your tests.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">My Written Tests</h1>
        <p className="mt-1 text-sm text-muted">Purchased tests and secure exam attempts.</p>
      </div>

      <section>
        <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Enrolled</h2>
        {data.enrolled.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
            No purchased tests yet.{' '}
            <Link href="/tests" className="font-semibold text-navy-600 hover:underline">
              Browse written tests
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.enrolled.map((t) => {
              const status = t.attempt?.status;
              return (
                <article key={t.id} className="rounded-xl border border-border bg-surface p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-600 dark:bg-navy-800">
                      <ClipboardList size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading font-bold text-foreground">{t.title}</h3>
                      <p className="text-xs text-muted">
                        {t.totalQuestions} Qs
                        {t.durationMins ? ` · ${t.durationMins} min` : ''}
                      </p>
                      {status && (
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          Status: {status.replace('_', ' ')}
                          {t.attempt?.score != null ? ` · Score ${t.attempt.score}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!status || status === 'IN_PROGRESS' ? (
                      <Button href={`/dashboard/tests/${t.id}/attempt`} size="sm">
                        {status === 'IN_PROGRESS' ? 'Resume exam' : 'Start exam'}
                      </Button>
                    ) : (
                      <Button href={`/dashboard/tests/${t.id}/result`} size="sm">
                        View result
                      </Button>
                    )}
                    <Button href={`/tests/${t.slug}`} variant="outline" size="sm">
                      Details
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {data.available.length > 0 && (
        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Also available</h2>
          <ul className="space-y-2">
            {data.available.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <span className="text-foreground">
                  {t.title} · ₹{t.price} · {t.windowState}
                </span>
                <Link href={`/tests/${t.slug}`} className="font-semibold text-navy-600 hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
