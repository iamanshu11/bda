'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ClipboardList, Loader2, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';
import { loadRazorpay, openRazorpayCheckout } from '@/lib/razorpay';

interface TestDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  instructions?: string | null;
  price: number;
  durationMins?: number | null;
  totalQuestions: number;
  marksPerQuestion: number;
  passingMarks?: number | null;
  negativeMark: number;
  availableFrom: string;
  availableTo: string;
  answersRevealAt?: string | null;
  maxCheatingAttempts: number;
  windowState: 'upcoming' | 'open' | 'closed';
}

export default function PublicTestDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, status } = useAuth();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: test, isLoading, isError } = useQuery({
    queryKey: ['public-test', slug],
    queryFn: async () => (await api.get(`/tests/${slug}`)).data.data as TestDetail,
  });

  async function buy() {
    if (!test) return;
    if (status !== 'authenticated') {
      router.push(`/signup?redirect=${encodeURIComponent(`/tests/${slug}`)}`);
      return;
    }
    setBuying(true);
    setError(null);
    try {
      const { data } = await api.post(`/students/tests/${test.id}/order`);
      const order = data.data as {
        free: boolean;
        orderId?: string;
        amount?: number;
        keyId?: string;
        courseTitle?: string;
      };
      if (order.free) {
        router.push(`/dashboard/tests`);
        return;
      }
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load the payment gateway.');
      const result = await openRazorpayCheckout({
        keyId: order.keyId!,
        orderId: order.orderId!,
        amount: order.amount!,
        courseTitle: order.courseTitle ?? test.title,
        prefill: { name: user?.name, email: user?.email },
      });
      await api.post('/students/payments/verify', result);
      router.push('/dashboard/tests');
    } catch (err) {
      const msg =
        err instanceof Error && err.message === 'Payment cancelled'
          ? 'Payment cancelled.'
          : getApiErrorMessage(err);
      if (msg.toLowerCase().includes('already enrolled')) {
        router.push('/dashboard/tests');
        return;
      }
      setError(msg);
    } finally {
      setBuying(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-navy-500" size={32} />
      </div>
    );
  }

  if (isError || !test) {
    return (
      <Container className="py-16">
        <p className="text-center text-muted">Test not found.</p>
        <div className="mt-4 text-center">
          <Link href="/tests" className="text-navy-600 hover:underline">
            Back to tests
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <section className="bg-background py-12">
      <Container>
        <Link href="/tests" className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={14} /> All written tests
        </Link>

        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-600 dark:bg-navy-800">
            <ClipboardList size={24} />
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold text-foreground">{test.title}</h1>
          {test.description && <p className="mt-3 text-muted">{test.description}</p>}

          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Price</dt>
              <dd className="font-semibold text-foreground">₹{test.price}</dd>
            </div>
            <div>
              <dt className="text-muted">Questions</dt>
              <dd className="font-semibold text-foreground">{test.totalQuestions}</dd>
            </div>
            <div>
              <dt className="text-muted">Duration</dt>
              <dd className="font-semibold text-foreground">
                {test.durationMins ? `${test.durationMins} minutes` : 'No limit'}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Marking</dt>
              <dd className="font-semibold text-foreground">
                +{test.marksPerQuestion} correct
                {test.negativeMark > 0 ? ` · −${test.negativeMark} wrong` : ' · no negative'}
              </dd>
            </div>
            {test.passingMarks != null && (
              <div>
                <dt className="text-muted">Passing marks</dt>
                <dd className="font-semibold text-foreground">{test.passingMarks}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Window</dt>
              <dd className="font-semibold capitalize text-foreground">{test.windowState}</dd>
            </div>
            <div>
              <dt className="text-muted">Available</dt>
              <dd className="text-foreground">
                {new Date(test.availableFrom).toLocaleString('en-IN')} →{' '}
                {new Date(test.availableTo).toLocaleString('en-IN')}
              </dd>
            </div>
            {test.answersRevealAt && (
              <div>
                <dt className="text-muted">Answers reveal</dt>
                <dd className="text-foreground">{new Date(test.answersRevealAt).toLocaleString('en-IN')}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex items-start gap-2 rounded-lg bg-navy-50 p-4 text-sm text-navy-800 dark:bg-navy-900/40 dark:text-navy-100">
            <Shield size={18} className="mt-0.5 shrink-0" />
            <p>
              Secure Exam Mode is enabled (max {test.maxCheatingAttempts} cheating attempts). Stay in
              full-screen; tab switches and window exits are logged and may auto-submit your test.
            </p>
          </div>

          {test.instructions && (
            <div className="mt-6">
              <h2 className="font-heading font-bold text-foreground">Instructions</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{test.instructions}</p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={buying || test.windowState === 'closed'}
              onClick={buy}
            >
              {buying ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Processing…
                </>
              ) : status !== 'authenticated' ? (
                'Sign up to purchase'
              ) : test.price > 0 ? (
                `Pay ₹${test.price} & enrol`
              ) : (
                'Enrol for free'
              )}
            </Button>
            <Button href="/dashboard/tests" variant="outline" size="lg">
              My tests
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
