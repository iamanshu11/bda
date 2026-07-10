import { cn } from '@/lib/utils';

/** Centered eyebrow + title + subtitle used across homepage sections. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  invert = false,
  className,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  align?: 'center' | 'left';
  /** Use on dark section backgrounds. */
  invert?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'text-sm font-semibold uppercase tracking-widest',
            invert ? 'text-rust-300' : 'text-navy-500',
          )}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <h2
          className={cn(
            'mt-2 font-heading text-2xl font-bold sm:text-3xl',
            invert ? 'text-white' : 'text-foreground',
          )}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className={cn('mt-3 text-base', invert ? 'text-navy-100/80' : 'text-muted')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
