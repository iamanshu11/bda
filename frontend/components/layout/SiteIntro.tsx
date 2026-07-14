'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { siteConfig } from '@/constants/site';
import { useAuth } from '@/store/auth';

const WORDS = ['DREAM', 'DISCIPLINE', 'DEFEND'] as const;
const STORAGE_KEY = 'bda-intro-seen';
/** Total intro runtime including exit (ms). */
const INTRO_MS = 3000;
const EXIT_MS = 600;

/**
 * Home-page intro for guests only (~3s).
 * Skips when logged in, on other routes, reduced-motion, or already seen this session.
 */
export function SiteIntro() {
  const pathname = usePathname();
  const { status } = useAuth();
  const [gate, setGate] = useState(false);
  const [play, setPlay] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [wordIndex, setWordIndex] = useState(-1);

  const onHome = pathname === '/';

  // Soft cover while auth resolves on the home page (avoids page flash before decision)
  useEffect(() => {
    if (!onHome) {
      setGate(false);
      setPlay(false);
      return;
    }
    if (status === 'loading') {
      setGate(true);
      setPlay(false);
    }
  }, [onHome, status]);

  useEffect(() => {
    if (!onHome) return;
    if (status === 'loading') return;

    let timers: number[] = [];
    let cancelled = false;

    if (status === 'authenticated') {
      setGate(false);
      setPlay(false);
      return;
    }

    try {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const seen = sessionStorage.getItem(STORAGE_KEY) === '1';
      if (reduced || seen) {
        setGate(false);
        setPlay(false);
        return;
      }
    } catch {
      /* continue */
    }

    setGate(true);
    setPlay(true);
    setExiting(false);
    setWordIndex(-1);
    document.body.style.overflow = 'hidden';

    // ~3s total: words stamp in, brief hold, then exit
    const wordStarts = [180, 700, 1220];
    WORDS.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setWordIndex(i);
        }, wordStarts[i]),
      );
    });

    const exitAt = INTRO_MS - EXIT_MS;
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) setExiting(true);
      }, exitAt),
    );

    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        try {
          sessionStorage.setItem(STORAGE_KEY, '1');
        } catch {
          /* ignore */
        }
        document.body.style.overflow = '';
        setGate(false);
        setPlay(false);
      }, INTRO_MS),
    );

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      document.body.style.overflow = '';
    };
  }, [onHome, status]);

  if (!gate) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-navy-950',
        exiting && 'pointer-events-none animate-intro-exit',
      )}
      role="presentation"
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(27,61,127,0.4),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.55)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950 via-transparent to-navy-950" />

      {play && (
        <div className="relative flex flex-col items-center px-6 text-center">
          <div className="mb-8 h-14 w-14 animate-intro-logo sm:mb-10 sm:h-[4.5rem] sm:w-[4.5rem]">
            <span className="relative block h-full w-full">
              <Image src="/logo.png" alt="" fill sizes="72px" className="object-contain" priority />
            </span>
          </div>

          <p className="mb-5 font-heading text-[10px] font-bold uppercase tracking-[0.45em] text-rust-400/90 sm:mb-6 sm:text-xs sm:tracking-[0.55em]">
            {siteConfig.name}
          </p>

          <div className="flex min-h-[8.5rem] flex-col items-center justify-center gap-2 sm:min-h-[11rem] sm:gap-3">
            {WORDS.map((word, i) => {
              const active = wordIndex >= i;
              const isLatest = wordIndex === i;
              return (
                <span
                  key={word}
                  className={cn(
                    'block font-heading text-3xl font-extrabold uppercase tracking-[0.2em] text-white sm:text-5xl md:text-6xl md:tracking-[0.24em]',
                    i === 1 && 'text-rust-400',
                    active
                      ? isLatest
                        ? 'animate-intro-word'
                        : 'opacity-100'
                      : 'translate-y-5 scale-95 opacity-0',
                  )}
                >
                  {word}
                </span>
              );
            })}
          </div>

          <div
            className={cn(
              'mt-7 h-0.5 origin-center bg-gradient-to-r from-transparent via-rust-500 to-transparent transition-all duration-500 sm:mt-9',
              wordIndex >= WORDS.length - 1 ? 'w-40 opacity-100 sm:w-56' : 'w-0 opacity-0',
            )}
          />
        </div>
      )}
    </div>
  );
}
