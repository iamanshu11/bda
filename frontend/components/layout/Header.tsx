'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainNav } from '@/constants/navigation';
import { Logo } from './Logo';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/store/auth';
import { dashboardPathForRole } from '@/types/auth';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const dashHref = user ? dashboardPathForRole(user.role) : '/login';

  async function handleMobileLogout() {
    setMobileOpen(false);
    await signOut();
    router.replace('/');
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  // Body scroll lock + Escape + initial focus
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    // Defer focus so the drawer is painted
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors duration-300',
        scrolled
          ? 'border-border bg-background/90 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-background',
      )}
    >
      <div className="container flex h-16 min-w-0 items-center justify-between gap-2 sm:gap-4 lg:h-20">
        <div className="min-w-0 shrink">
          <Logo priority />
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {mainNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
                  active
                    ? 'text-navy-600 dark:text-white'
                    : 'text-foreground/80 hover:text-navy-600 dark:hover:text-white',
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-rust-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="hidden h-10 w-10 sm:inline-flex" />

          {status === 'authenticated' ? (
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Button href="/enroll" size="sm">
                Enroll Now
              </Button>
              <UserMenu />
            </div>
          ) : (
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Button href="/login" variant="ghost" size="sm">
                Login
              </Button>
              <Button href="/enroll" size="sm">
                Enroll Now
              </Button>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="relative h-6 w-6">
              <Menu
                size={24}
                className={cn(
                  'absolute inset-0 transition-all duration-300',
                  mobileOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
                )}
              />
              <X
                size={24}
                className={cn(
                  'absolute inset-0 transition-all duration-300',
                  mobileOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer + backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] lg:hidden',
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
          aria-label="Navigation menu"
          className={cn(
            'absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl transition-transform duration-300 ease-in-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
            <Logo />
            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3" aria-label="Mobile">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex min-h-10 items-center rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500',
                  pathname === item.href
                    ? 'bg-navy-600 text-white'
                    : 'text-foreground/80 hover:bg-surface-alt hover:text-foreground',
                )}
              >
                <span className="truncate">{item.label}</span>
              </Link>
            ))}

            {status === 'authenticated' && user && (
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                <Link
                  href={dashHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-foreground/80 transition-colors hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
                >
                  <LayoutDashboard size={18} className="shrink-0" />
                  <span className="truncate">Dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 dark:hover:bg-red-950/30"
                >
                  <LogOut size={18} className="shrink-0" />
                  <span className="truncate">Log out</span>
                </button>
              </div>
            )}
          </nav>

          <div className="shrink-0 space-y-3 border-t border-border p-4">
            <div className="flex flex-col gap-2">
              {status !== 'authenticated' && (
                <Button
                  href="/login"
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Button>
              )}
              <Button href="/enroll" size="md" className="w-full" onClick={() => setMobileOpen(false)}>
                Enroll Now
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
