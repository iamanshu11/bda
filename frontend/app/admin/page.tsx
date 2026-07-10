'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Loader2, Mail, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/dashboard/StatCard';

interface Overview {
  stats: { users: number; courses: number; enrollments: number; newMessages: number };
  recentMessages: { id: string; name: string; subject: string | null; createdAt: string }[];
  recentEnrollments: { id: string; user: { name: string }; course: { title: string } }[];
}

export default function AdminOverview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data as Overview,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>;
  if (isError || !data)
    return <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load overview. Make sure the API is running and you are an admin.</p>;

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={data.stats.users} icon={Users} />
        <StatCard label="Courses" value={data.stats.courses} icon={BookOpen} />
        <StatCard label="Enrollments" value={data.stats.enrollments} icon={GraduationCap} />
        <StatCard label="New Messages" value={data.stats.newMessages} icon={Mail} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-heading text-lg font-bold text-foreground">Recent Messages</h3>
          {data.recentMessages.length === 0 ? (
            <p className="text-muted">No messages yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentMessages.map((m) => (
                <li key={m.id} className="py-3">
                  <p className="font-medium text-foreground">{m.name}</p>
                  <p className="text-sm text-muted">{m.subject ?? 'No subject'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-heading text-lg font-bold text-foreground">Recent Enrollments</h3>
          {data.recentEnrollments.length === 0 ? (
            <p className="text-muted">No enrollments yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentEnrollments.map((e) => (
                <li key={e.id} className="flex justify-between py-3">
                  <span className="font-medium text-foreground">{e.user?.name}</span>
                  <span className="text-sm text-muted">{e.course?.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
