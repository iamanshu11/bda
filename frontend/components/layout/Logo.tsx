import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/constants/site';

/**
 * Brand lockup. Uses a placeholder shield icon; drop the real crest at
 * /public/logo.png and swap the icon for <Image src="/logo.png" .../>.
 */
export function Logo({ invert = false }: { invert?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label={siteConfig.name}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-700 text-white ring-2 ring-rust-400/60 transition-transform group-hover:scale-105">
        <ShieldCheck size={22} />
      </span>
      <span
        className={cn(
          'font-heading text-sm font-extrabold uppercase leading-tight tracking-wide sm:text-base',
          invert ? 'text-white' : 'text-navy-700 dark:text-white',
        )}
      >
        Bokaro Defence
        <br className="hidden sm:block" /> Academy
      </span>
    </Link>
  );
}
