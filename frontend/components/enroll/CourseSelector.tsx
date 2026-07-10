'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { loadRazorpay, openRazorpayCheckout } from '@/lib/razorpay';

interface OrderResponse {
  free: boolean;
  enrolled?: boolean;
  orderId?: string;
  amount?: number;
  keyId?: string;
  courseTitle?: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDesc?: string | null;
  badge?: string | null;
  badgeType?: 'FOUNDATION' | 'GUARANTEE';
  durationWeeks?: number | null;
  fees?: string | number | null;
  category?: { name: string } | null;
}

export function CourseSelector({ initialCourse }: { initialCourse?: string }) {
  const router = useRouter();
  const { user, status } = useAuth();
  const [selected, setSelected] = useState<string | null>(initialCourse ?? null);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTried = useRef(false);

  const { data: courses, isLoading, isError } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => (await api.get('/courses', { params: { limit: 50 } })).data.data as Course[],
  });

  const enroll = useCallback(
    async (courseId: string) => {
      setError(null);
      setEnrolling(true);
      try {
        // Create an order — the backend enrolls free courses directly.
        const { data } = await api.post('/students/payments/order', { courseId });
        const order = data.data as OrderResponse;

        if (order.free) {
          router.push('/dashboard/courses');
          return;
        }

        const ok = await loadRazorpay();
        if (!ok) throw new Error('Could not load the payment gateway. Check your connection.');

        const result = await openRazorpayCheckout({
          keyId: order.keyId!,
          orderId: order.orderId!,
          amount: order.amount!,
          courseTitle: order.courseTitle ?? 'Course',
          prefill: { name: user?.name, email: user?.email },
        });

        await api.post('/students/payments/verify', result);
        router.push('/dashboard/courses');
      } catch (err) {
        const msg = err instanceof Error && err.message === 'Payment cancelled' ? 'Payment cancelled.' : getApiErrorMessage(err);
        if (msg.toLowerCase().includes('already enrolled')) {
          router.push('/dashboard/courses');
          return;
        }
        setError(msg);
        setEnrolling(false);
      }
    },
    [router, user],
  );

  // Returning from signup/login with a pre-selected course → auto-enroll once.
  useEffect(() => {
    if (status === 'authenticated' && initialCourse && !autoTried.current) {
      autoTried.current = true;
      void enroll(initialCourse);
    }
  }, [status, initialCourse, enroll]);

  async function handleEnroll() {
    if (!selected) return;
    // Not signed in → send to signup, remembering the chosen course.
    if (status !== 'authenticated') {
      router.push(`/signup?redirect=${encodeURIComponent(`/enroll?course=${selected}`)}`);
      return;
    }
    await enroll(selected);
  }

  return (
    <section className="bg-background py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Select your course
          </h2>
          <p className="mt-2 text-muted">
            Choose the course you want to join. You&apos;ll get access to its content in your
            dashboard right after enrolling.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
        ) : isError ? (
          <p className="mx-auto mt-10 max-w-md rounded-lg border border-border bg-surface p-6 text-center text-muted">
            Could not load courses. Please make sure the API is running and try again.
          </p>
        ) : !courses || courses.length === 0 ? (
          <p className="mx-auto mt-10 max-w-md rounded-lg border border-border bg-surface p-6 text-center text-muted">
            No courses are available yet. Please check back soon — our team is adding them.
          </p>
        ) : (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const isSel = selected === course.id;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelected(course.id)}
                    className={cn(
                      'group flex flex-col rounded-xl border-2 bg-surface p-5 text-left transition-all',
                      isSel
                        ? 'border-rust-500 shadow-md'
                        : 'border-border hover:-translate-y-1 hover:border-navy-300 hover:shadow',
                    )}
                    aria-pressed={isSel}
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-600 dark:bg-navy-800 dark:text-navy-200">
                        <BookOpen size={20} />
                      </span>
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                          isSel ? 'border-rust-500 bg-rust-500 text-white' : 'border-border',
                        )}
                      >
                        {isSel && <Check size={14} />}
                      </span>
                    </div>
                    {course.badge && (
                      <span className="mt-4 w-fit rounded-md bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                        {course.badge}
                      </span>
                    )}
                    <h3 className="mt-3 font-heading text-lg font-bold text-foreground">{course.title}</h3>
                    {course.category?.name && (
                      <p className="text-xs text-muted">{course.category.name}</p>
                    )}
                    {course.shortDesc && <p className="mt-2 flex-1 text-sm text-muted">{course.shortDesc}</p>}
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                      {course.durationWeeks ? <span>{course.durationWeeks} weeks</span> : null}
                      {course.fees ? <span className="font-semibold text-foreground">₹{course.fees}</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}

            <div className="mt-10 flex flex-col items-center gap-3">
              {(() => {
                const selCourse = courses?.find((c) => c.id === selected);
                const fee = selCourse?.fees ? Number(selCourse.fees) : 0;
                const label =
                  status !== 'authenticated'
                    ? 'Continue to sign up'
                    : fee > 0
                      ? `Pay ₹${fee.toLocaleString('en-IN')} & Enroll`
                      : 'Enroll for Free';
                return (
                  <Button size="lg" onClick={handleEnroll} disabled={!selected || enrolling}>
                    {enrolling ? (
                      <><Loader2 className="animate-spin" size={18} /> Processing…</>
                    ) : (
                      <>{label} <ArrowRight size={18} /></>
                    )}
                  </Button>
                );
              })()}
              {status !== 'authenticated' && (
                <p className="text-sm text-muted">
                  Already have an account?{' '}
                  <button
                    onClick={() =>
                      router.push(`/login?redirect=${encodeURIComponent(`/enroll${selected ? `?course=${selected}` : ''}`)}`)
                    }
                    className="font-semibold text-navy-600 hover:underline dark:text-navy-200"
                  >
                    Log in
                  </button>
                </p>
              )}
              {user?.role && !['STUDENT', 'FACULTY'].includes(user.role) && (
                <p className="text-xs text-muted">You are signed in as {user.role.replace('_', ' ')}.</p>
              )}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
