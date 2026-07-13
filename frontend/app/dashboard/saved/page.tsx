'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface WishlistItem {
  id: string;
  courseId: string;
  course: { id: string; title: string; slug: string; shortDesc?: string | null; fees?: string | number | null; category?: { name: string } | null };
}

export default function SavedPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get('/students/wishlist')).data.data as WishlistItem[],
  });

  const remove = useMutation({
    mutationFn: (courseId: string) => api.delete(`/students/wishlist/${courseId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold text-foreground">Saved Missions</h2>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-navy-500" /></div>
      ) : isError ? (
        <p className="rounded-lg border border-border bg-surface p-6 text-muted">Could not load your saved courses.</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-muted">You haven&apos;t saved any missions yet.</p>
          <Link href="/courses" className="mt-3 inline-block font-semibold text-navy-600 hover:underline dark:text-navy-200">
            Browse missions →
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((w) => (
            <div key={w.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
              {w.course.category?.name && (
                <span className="w-fit rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                  {w.course.category.name}
                </span>
              )}
              <h3 className="mt-3 font-heading text-lg font-bold text-foreground">{w.course.title}</h3>
              {w.course.shortDesc && <p className="mt-1 flex-1 text-sm text-muted">{w.course.shortDesc}</p>}
              {w.course.fees ? <p className="mt-2 text-sm font-semibold text-foreground">₹{w.course.fees}</p> : null}
              <div className="mt-4 flex items-center gap-2">
                <Button href={`/enroll?course=${w.course.id}`} size="sm" className="flex-1">
                  Enroll <ArrowRight size={15} />
                </Button>
                <button
                  onClick={() => remove.mutate(w.courseId)}
                  className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
