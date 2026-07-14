import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/constants/site';

/**
 * Brand lockup: crest from /public/logo.png + single-line academy name.
 */
export function Logo({
  invert = false,
  compact = false,
  priority = false,
}: {
  invert?: boolean;
  /** Icon-only (e.g. collapsed sidebar rail). */
  compact?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        'group flex min-w-0 items-center gap-2 sm:gap-2.5',
        compact && 'justify-center',
      )}
      aria-label={siteConfig.name}
      title={siteConfig.name}
    >
      <span
        className={cn(
          'relative shrink-0 overflow-hidden transition-transform group-hover:scale-105',
          compact ? 'h-10 w-10' : 'h-9 w-9 sm:h-11 sm:w-11',
        )}
      >
        <Image
          src="/logo.png"
          alt=""
          fill
          sizes="44px"
          className="object-contain"
          priority={priority}
        />
      </span>

      {!compact && (
        <span
          className={cn(
            'min-w-0 truncate whitespace-nowrap font-heading text-xs font-extrabold uppercase tracking-wide sm:text-sm lg:text-base',
            invert ? 'text-white' : 'text-navy-700 dark:text-white',
          )}
        >
          Bokaro Defence Academy
        </span>
      )}
    </Link>
  );
}
