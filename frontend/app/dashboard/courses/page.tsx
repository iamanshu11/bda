'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  courseId: string;
  course: { title: string; slug: string; shortDesc?: string | null; category?: { name: string } | null };
}

export default function MyCoursesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => (await api.get('/students/courses')).data.data as Enrollment[],
  });

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Training Missions</h2>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : isError ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load courses.</p>
      ) : data!.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-muted">You haven&apos;t enlisted in any training missions yet.</p>
          <Link href="/courses" className="mt-3 inline-block font-semibold text-navy-600 hover:underline dark:text-navy-200">
            Browse missions →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((e) => (
            <div key={e.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
              {e.course.category?.name && (
                <span className="w-fit rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                  {e.course.category.name}
                </span>
              )}
              <h3 className="mt-3 font-heading text-lg font-bold text-foreground">{e.course.title}</h3>
              {e.course.shortDesc && <p className="mt-1 flex-1 text-sm text-muted">{e.course.shortDesc}</p>}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted">
                  <span>Progress</span>
                  <span>{e.progress}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-alt">
                  <div className="h-full rounded-full bg-rust-500" style={{ width: `${e.progress}%` }} />
                </div>
              </div>
              <Button href={`/dashboard/learn/${e.courseId}`} size="sm" className="mt-4 w-full">
                Resume Operation <ArrowRight size={15} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
