'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Accessible centered modal with backdrop. */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
