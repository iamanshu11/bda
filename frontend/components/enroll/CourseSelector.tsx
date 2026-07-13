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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<{ code: string; discount: number; finalAmount: number } | null>(null);

  const { data: courses, isLoading, isError } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => (await api.get('/courses', { params: { limit: 50 } })).data.data as Course[],
  });

  const enroll = useCallback(
    async (courseId: string, couponCodeArg?: string) => {
      setError(null);
      setEnrolling(true);
      try {
        // Create an order — the backend enrolls free courses directly.
        const { data } = await api.post('/students/payments/order', { courseId, couponCode: couponCodeArg });
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

  // Reset any applied coupon when the selected course changes.
  useEffect(() => {
    setCoupon(null);
    setCouponError(null);
    setCouponCode('');
  }, [selected]);

  async function applyCoupon() {
    if (!selected || !couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.post('/students/coupons/validate', { code: couponCode.trim(), courseId: selected });
      const info = res.data.data as { code: string; discount: number; finalAmount: number };
      setCoupon(info);
    } catch (err) {
      setCoupon(null);
      setCouponError(getApiErrorMessage(err));
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleEnroll() {
    if (!selected) return;
    // Not signed in → send to signup, remembering the chosen course.
    if (status !== 'authenticated') {
      router.push(`/signup?redirect=${encodeURIComponent(`/enroll?course=${selected}`)}`);
      return;
    }
    await enroll(selected, coupon?.code);
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

            {(() => {
              const selCourse = courses?.find((c) => c.id === selected);
              const fee = selCourse?.fees ? Number(selCourse.fees) : 0;
              const showCoupon = status === 'authenticated' && fee > 0;
              const payable = coupon ? coupon.finalAmount : fee;
              const label =
                status !== 'authenticated'
                  ? 'Continue to sign up'
                  : fee > 0
                    ? `Pay ₹${payable.toLocaleString('en-IN')} & Enroll`
                    : 'Enroll for Free';
              return (
                <div className="mt-10 flex flex-col items-center gap-3">
                  {showCoupon && (
                    <div className="w-full max-w-sm">
                      <div className="flex gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Coupon code"
                          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                        <Button variant="outline" size="md" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                          {applyingCoupon ? <Loader2 className="animate-spin" size={16} /> : 'Apply'}
                        </Button>
                      </div>
                      {couponError && <p className="mt-1 text-xs text-red-600">{couponError}</p>}
                      {coupon && (
                        <div className="mt-2 flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-sm dark:bg-green-950/30">
                          <span className="font-medium text-green-700 dark:text-green-300">
                            {coupon.code} applied — you save ₹{coupon.discount.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => { setCoupon(null); setCouponCode(''); }}
                            className="text-xs text-muted hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {coupon && (
                        <p className="mt-2 text-center text-sm text-muted">
                          <span className="line-through">₹{fee.toLocaleString('en-IN')}</span>{' '}
                          <span className="font-bold text-foreground">₹{payable.toLocaleString('en-IN')}</span>
                        </p>
                      )}
                    </div>
                  )}
                  <Button size="lg" onClick={handleEnroll} disabled={!selected || enrolling}>
                    {enrolling ? (
                      <><Loader2 className="animate-spin" size={18} /> Processing…</>
                    ) : (
                      <>{label} <ArrowRight size={18} /></>
                    )}
                  </Button>
                </div>
              );
            })()}

            <div className="mt-3 flex flex-col items-center gap-3">
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
