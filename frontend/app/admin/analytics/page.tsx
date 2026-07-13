'use client';

import { useQuery } from '@tanstack/react-query';
import { BadgeIndianRupee, CalendarDays, GraduationCap, Loader2, RefreshCcw, ShoppingCart, TrendingUp, UserPlus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/dashboard/StatCard';

interface Analytics {
  revenue: { today: number; month: number };
  stats: {
    totalStudents: number;
    activeUsers: number;
    newToday: number;
    newThisWeek: number;
    courseSales: number;
    refunds: number;
    pendingPayments: number;
  };
  topCourses: { courseId: string; title: string; sales: number; revenue: number }[];
  recentPayments: { id: string; amount: number; user: string; course: string; createdAt: string }[];
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data.data as Analytics,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>;
  if (isError || !data) return <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load analytics.</p>;

  const maxRevenue = Math.max(1, ...data.topCourses.map((c) => c.revenue));

  return (
    <div className="space-y-8">
      <h2 className="font-heading text-2xl font-bold text-foreground">Analytics</h2>

      {/* Revenue */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue Today" value={inr(data.revenue.today)} icon={BadgeIndianRupee} />
        <StatCard label="Revenue This Month" value={inr(data.revenue.month)} icon={TrendingUp} />
        <StatCard label="Course Sales" value={data.stats.courseSales} icon={ShoppingCart} />
        <StatCard label="Pending Payments" value={data.stats.pendingPayments} icon={CalendarDays} />
      </div>

      {/* Users */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={data.stats.totalStudents} icon={Users} />
        <StatCard label="Active (30d)" value={data.stats.activeUsers} icon={GraduationCap} />
        <StatCard label="New Today" value={data.stats.newToday} icon={UserPlus} />
        <StatCard label="Refunds" value={data.stats.refunds} icon={RefreshCcw} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top courses */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-heading text-lg font-bold text-foreground">Top Courses by Revenue</h3>
          {data.topCourses.length === 0 ? (
            <p className="text-muted">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.topCourses.map((c) => (
                <li key={c.courseId}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate text-foreground">{c.title}</span>
                    <span className="text-muted">{inr(c.revenue)} · {c.sales} sales</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-alt">
                    <div className="h-full rounded-full bg-navy-500" style={{ width: `${(c.revenue / maxRevenue) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent payments */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-heading text-lg font-bold text-foreground">Recent Payments</h3>
          {data.recentPayments.length === 0 ? (
            <p className="text-muted">No payments yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.user}</p>
                    <p className="truncate text-xs text-muted">{p.course}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{inr(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
