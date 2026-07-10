'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { dashboardPathForRole, roleLabel } from '@/types/auth';

/** Avatar dropdown for signed-in users: shows Dashboard + Logout. */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;
  const dashHref = dashboardPathForRole(user.role);

  async function handleLogout() {
    setOpen(false);
    await signOut();
    router.replace('/');
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-full border border-border bg-background pl-1 pr-2.5 transition-colors hover:bg-surface-alt"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-600 text-xs font-bold text-white">
          {user.name?.charAt(0).toUpperCase() ?? 'U'}
        </span>
        <ChevronDown size={15} className="text-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <span className="mt-1 inline-block rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700 dark:bg-navy-800 dark:text-navy-200">
              {roleLabel(user.role)}
            </span>
          </div>
          <Link
            href={dashHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-alt"
            role="menuitem"
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            role="menuitem"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
