'use client';

import { Phone } from 'lucide-react';
import { siteConfig } from '@/constants/site';

/**
 * Fixed bottom-left “Call Now” FAB with pulse / blink rings.
 * Shown on public marketing pages only.
 */
export function FloatingCallButton() {
  const tel = siteConfig.contact.phone.replace(/\s/g, '');

  return (
    <a
      href={`tel:${tel}`}
      aria-label={`Call Now — ${siteConfig.contact.phone}`}
      title={`Call ${siteConfig.contact.phone}`}
      className="group fixed bottom-5 right-4 z-[45] flex items-center gap-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rust-400 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      {/* Pulsing rings */}
      <span className="pointer-events-none absolute left-0 top-0 flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
        <span className="absolute inset-0 animate-call-ping rounded-full bg-rust-500/40" />
        <span className="absolute inset-0 animate-call-ping rounded-full bg-rust-500/30 [animation-delay:0.6s]" />
        <span className="absolute inset-1 animate-call-blink rounded-full bg-rust-400/20" />
      </span>

      {/* Circular phone button */}
      <span className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rust-500 text-white shadow-lg shadow-rust-500/40 transition-transform duration-300 group-hover:scale-110 group-hover:bg-rust-600 sm:h-16 sm:w-16">
        <Phone
          size={24}
          className="animate-call-wiggle shrink-0"
          strokeWidth={2.25}
        />
      </span>
    </a>
  );
}
