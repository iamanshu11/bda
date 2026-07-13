'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage } from '@/lib/errors';
import type { ApiReview } from '@/types/api';

interface ReviewsData {
  reviews: ApiReview[];
  average: number;
  count: number;
}
interface Eligibility {
  canReview: boolean;
  completed: boolean;
  alreadyReviewed: boolean;
}

export function CourseReviews({ slug, courseId }: { slug: string; courseId: string }) {
  const { status } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reviewsQuery = useQuery({
    queryKey: ['course-reviews', slug],
    queryFn: async () => (await api.get(`/courses/${slug}/reviews`)).data.data as ReviewsData,
  });

  const eligibilityQuery = useQuery({
    queryKey: ['review-eligibility', courseId],
    queryFn: async () => (await api.get(`/students/courses/${courseId}/review-eligibility`)).data.data as Eligibility,
    enabled: status === 'authenticated',
    retry: false,
  });

  const submit = useMutation({
    mutationFn: () => api.post(`/students/courses/${courseId}/reviews`, { rating, title: title || undefined, body: body || undefined }),
    onSuccess: () => {
      setDone(true);
      qc.invalidateQueries({ queryKey: ['review-eligibility', courseId] });
    },
    onError: (e) => setError(getApiErrorMessage(e)),
  });

  const data = reviewsQuery.data;
  const canReview = eligibilityQuery.data?.canReview;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-xl font-bold text-foreground">Reviews</h2>
        {data && data.count > 0 && (
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <StarRating value={data.average} /> {data.average} · {data.count} review{data.count === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Leave a review (completers only) */}
      {status === 'authenticated' && canReview && !done && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <p className="font-semibold text-foreground">Share your experience</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)} aria-label={`${i} stars`}>
                <Star size={24} className={i <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-border'} />
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="How did this course help you?"
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button className="mt-3" size="sm" onClick={() => { setError(null); submit.mutate(); }} disabled={submit.isPending}>
            {submit.isPending ? <><Loader2 className="animate-spin" size={15} /> Submitting…</> : 'Submit review'}
          </Button>
        </div>
      )}
      {done && (
        <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
          Thanks! Your review will appear once approved.
        </p>
      )}

      {/* Reviews list */}
      <div className="mt-5 space-y-4">
        {reviewsQuery.isLoading ? (
          <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-navy-500" /></div>
        ) : !data || data.reviews.length === 0 ? (
          <p className="text-muted">No reviews yet — be the first once you complete this course.</p>
        ) : (
          data.reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{r.author}</span>
                <StarRating value={r.rating} size={14} />
              </div>
              {r.title && <p className="mt-1 font-medium text-foreground">{r.title}</p>}
              {r.body && <p className="mt-1 text-sm text-muted">{r.body}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
