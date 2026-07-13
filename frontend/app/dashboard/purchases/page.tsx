'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RefreshCcw } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/errors';
import { loadRazorpay, openRazorpayCheckout } from '@/lib/razorpay';

interface Payment {
  id: string;
  courseId: string;
  amount: number; // paise
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  course?: { title: string; slug: string } | null;
}

interface OrderResponse {
  free: boolean;
  orderId?: string;
  amount?: number;
  keyId?: string;
  courseTitle?: string;
}

const statusStyle: Record<string, string> = {
  PAID: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300',
  CREATED: 'bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-navy-200',
  FAILED: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  REFUNDED: 'bg-surface-alt text-muted',
};

export default function PurchasesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-payments'],
    queryFn: async () => (await api.get('/students/payments')).data.data as Payment[],
  });

  async function retry(p: Payment) {
    setError(null);
    setRetryingId(p.id);
    try {
      const res = await api.post('/students/payments/order', { courseId: p.courseId });
      const order = res.data.data as OrderResponse;
      if (order.free) {
        qc.invalidateQueries({ queryKey: ['my-payments'] });
        return;
      }
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Could not load the payment gateway.');
      const result = await openRazorpayCheckout({
        keyId: order.keyId!,
        orderId: order.orderId!,
        amount: order.amount!,
        courseTitle: order.courseTitle ?? p.course?.title ?? 'Course',
        prefill: { name: user?.name, email: user?.email },
      });
      await api.post('/students/payments/verify', result);
      qc.invalidateQueries({ queryKey: ['my-payments'] });
      qc.invalidateQueries({ queryKey: ['student-courses'] });
    } catch (err) {
      const msg = err instanceof Error && err.message === 'Payment cancelled' ? 'Payment cancelled.' : getApiErrorMessage(err);
      if (!msg.toLowerCase().includes('already enrolled')) setError(msg);
      qc.invalidateQueries({ queryKey: ['my-payments'] });
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Purchases</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : isError ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load your purchases.</p>
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-10 text-center text-muted">No purchases yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{p.course?.title ?? 'Course'}</td>
                  <td className="px-4 py-3 text-foreground">₹{(p.amount / 100).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyle[p.status])}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 size={14} /> Enrolled</span>
                    ) : p.status === 'REFUNDED' ? (
                      <span className="text-xs text-muted">Refunded</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => retry(p)} disabled={retryingId === p.id}>
                        {retryingId === p.id ? <Loader2 className="animate-spin" size={14} /> : <><RefreshCcw size={14} /> Retry</>}
                      </Button>
                    )}
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
