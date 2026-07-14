'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, Menu, X, type LucideIcon } from 'lucide-react';
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

const COLLAPSE_KEY = 'bda-sidebar-collapsed';

/**
 * Shared dashboard chrome: collapsible desktop sidebar + mobile drawer + topbar.
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  function NavLinks({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
    return (
      <nav className={cn('flex-1 space-y-1 overflow-y-auto overscroll-contain p-3', compact && 'px-2')}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={compact ? item.label : undefined}
              aria-label={compact ? item.label : undefined}
              onClick={onNavigate}
              className={cn(
                'flex min-h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
                compact ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                active
                  ? 'bg-navy-600 text-white'
                  : 'text-foreground/80 hover:bg-surface-alt hover:text-foreground',
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!compact && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    );
  }

  function SidebarBody({
    compact = false,
    showClose = false,
    onNavigate,
  }: {
    compact?: boolean;
    showClose?: boolean;
    onNavigate?: () => void;
  }) {
    return (
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-border',
            compact ? 'justify-center px-2' : 'justify-between gap-2 px-4',
          )}
        >
          {!compact && (
            <div className="min-w-0 flex-1">
              <Logo />
            </div>
          )}
          {compact && <Logo compact />}
          {showClose && (
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
            >
              <X size={22} />
            </button>
          )}
        </div>

        <NavLinks compact={compact} onNavigate={onNavigate} />

        <div className={cn('mt-auto shrink-0 border-t border-border p-3', compact && 'px-2')}>
          <button
            type="button"
            onClick={handleLogout}
            title={compact ? 'Log out' : undefined}
            aria-label="Log out"
            className={cn(
              'flex min-h-10 w-full items-center gap-3 rounded-lg text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 dark:hover:bg-red-950/30',
              compact ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!compact && <span className="truncate">Log out</span>}
          </button>
        </div>
      </div>
    );
  }

  const desktopCollapsed = hydrated && collapsed;

  return (
    <div className="min-h-screen bg-surface-alt">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-surface transition-[width] duration-300 ease-in-out lg:block',
          desktopCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <SidebarBody compact={desktopCollapsed} />
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:bg-surface-alt hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
        >
          {desktopCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Dashboard navigation"
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-surface shadow-xl transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <SidebarBody showClose onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      <div
        className={cn(
          'min-w-0 transition-[padding] duration-300 ease-in-out',
          desktopCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-2 border-b border-border bg-background/90 px-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
            >
              <Menu size={22} />
            </button>
            <h1 className="truncate font-heading text-base font-bold text-foreground sm:text-lg">
              {title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden min-w-0 text-right md:block">
              <p className="max-w-[10rem] truncate text-sm font-semibold text-foreground lg:max-w-[14rem]">
                {user?.name}
              </p>
              <p className="text-xs text-muted">{user ? roleLabel(user.role) : ''}</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-600 text-sm font-bold text-white"
              title={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden p-3 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
