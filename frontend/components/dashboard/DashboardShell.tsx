'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/store/auth';
import { roleLabel } from '@/types/auth';

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Shared dashboard chrome: collapsible sidebar + topbar with user + logout.
 * Reused by the student and admin dashboards with different nav items.
 */
export function DashboardShell({
  nav,
  title,
  children,
}: {
  nav: DashboardNavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-navy-600 text-white'
                  : 'text-foreground/80 hover:bg-surface-alt hover:text-foreground',
              )}
            >
              <Icon size={18} /> {item.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <LogOut size={18} /> Log out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <h1 className="font-heading text-lg font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted">{user ? roleLabel(user.role) : ''}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Close button for mobile drawer */}
      {open && (
        <button
          className="fixed right-4 top-4 z-50 text-white lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      )}
    </div>
  );
}
