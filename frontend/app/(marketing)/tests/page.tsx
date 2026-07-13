'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

interface TestCard {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  durationMins?: number | null;
  totalQuestions: number;
  availableFrom: string;
  availableTo: string;
  windowState: 'upcoming' | 'open' | 'closed';
}

export default function PublicTestsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-tests'],
    queryFn: async () => (await api.get('/tests')).data.data as TestCard[],
  });

  return (
    <section className="bg-background py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-3xl font-bold text-foreground">Written Tests</h1>
          <p className="mt-2 text-muted">
            Paid MCQ mock tests with secure exam mode. Purchase a test, then attempt it within the
            availability window.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-navy-500" />
          </div>
        ) : isError ? (
          <p className="mt-10 text-center text-muted">Could not load tests.</p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((t) => (
              <article key={t.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-600 dark:bg-navy-800">
                  <ClipboardList size={20} />
                </span>
                <h2 className="mt-4 font-heading text-lg font-bold text-foreground">{t.title}</h2>
                {t.description && <p className="mt-2 flex-1 text-sm text-muted">{t.description}</p>}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                  <span>₹{t.price}</span>
                  <span>{t.totalQuestions} Qs</span>
                  {t.durationMins ? <span>{t.durationMins} min</span> : null}
                  <span className="font-semibold capitalize text-foreground">{t.windowState}</span>
                </div>
                <Button href={`/tests/${t.slug}`} className="mt-5 w-full" size="sm">
                  View details
                </Button>
              </article>
            ))}
          </div>
        )}
        <p className="mt-8 text-center text-sm text-muted">
          Already enrolled?{' '}
          <Link href="/dashboard/tests" className="font-semibold text-navy-600 hover:underline">
            Go to My Tests
          </Link>
        </p>
      </Container>
    </section>
  );
}
