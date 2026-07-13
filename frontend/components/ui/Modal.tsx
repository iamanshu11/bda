'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Accessible modal with backdrop.
 * Tall forms (e.g. Written Tests) scroll inside the panel so the title
 * and top fields are never clipped by the viewport.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Wider panel for long admin forms. */
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const maxW = size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden />

      {/*
        min-h-full + items-center: short modals stay centered.
        Panel uses max-height + inner scroll so tall forms (Written Tests, etc.)
        never clip the title or top fields.
      */}
      <div
        className="flex min-h-full items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        <div
          className={`relative z-10 flex w-full ${maxW} max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:max-h-[calc(100vh-3rem)]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-muted hover:bg-surface-alt hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
