import { cn } from '@/lib/utils';

const WORDS = ['DREAM', 'DISCIPLINE', 'DEFEND'] as const;

/**
 * Branded loader — stacked Dream / Discipline / Defend (never overlapping),
 * with a soft stagger pulse + progress bar.
 */
export function BrandLoader({
  className,
  fullScreen = false,
  label = 'Loading',
}: {
  className?: string;
  fullScreen?: boolean;
  label?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-7',
        fullScreen && 'min-h-[50vh] w-full bg-background py-16 sm:min-h-[60vh]',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-2.5 sm:gap-3">
        {WORDS.map((word, i) => (
          <span
            key={word}
            className={cn(
              'block whitespace-nowrap text-center font-heading text-base font-extrabold uppercase tracking-[0.28em] text-navy-700 animate-loader-pulse dark:text-navy-100 sm:text-lg sm:tracking-[0.32em]',
              i === 1 && 'text-rust-500 dark:text-rust-400',
            )}
            style={{ animationDelay: `${i * 0.22}s` }}
          >
            {word}
          </span>
        ))}
      </div>

      <div className="relative h-0.5 w-28 overflow-hidden rounded-full bg-border sm:w-36">
        <div className="absolute inset-y-0 left-0 w-1/2 animate-loader-bar rounded-full bg-rust-500" />
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
