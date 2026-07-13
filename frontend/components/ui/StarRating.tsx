import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Read-only star rating (supports halves via rounding). */
export function StarRating({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-border'}
        />
      ))}
    </span>
  );
}
