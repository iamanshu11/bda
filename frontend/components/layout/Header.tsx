'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainNav } from '@/constants/navigation';
import { siteConfig } from '@/constants/site';
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

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-colors duration-300',
        scrolled
          ? 'border-border bg-background/90 backdrop-blur-md shadow-sm'
          : 'border-transparent bg-background',
      )}
    >
      <div className="container-bda flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {mainNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'text-navy-600 dark:text-white' : 'text-foreground/80 hover:text-navy-600 dark:hover:text-white',
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
        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden h-9 w-9 sm:inline-flex" />
          <Button
            href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
            variant="outline"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Phone size={15} /> Call Now
          </Button>

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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-border bg-background transition-[max-height] duration-300 lg:hidden',
          mobileOpen ? 'max-h-96' : 'max-h-0 border-t-0',
        )}
      >
        <nav className="container-bda flex flex-col gap-1 py-4" aria-label="Mobile">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2.5 text-base font-medium transition-colors',
                pathname === item.href
                  ? 'bg-surface-alt text-navy-600 dark:text-white'
                  : 'text-foreground/80 hover:bg-surface-alt',
              )}
            >
              {item.label}
            </Link>
          ))}
          {status === 'authenticated' && user && (
            <div className="mt-2 border-t border-border pt-2">
              <Link
                href={dashHref}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-base font-medium text-foreground/80 hover:bg-surface-alt"
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <button
                onClick={handleMobileLogout}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut size={18} /> Log out
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            {status !== 'authenticated' && (
              <Button href="/login" variant="outline" size="md" className="flex-1">
                Login
              </Button>
            )}
            <Button href="/enroll" size="md" className="flex-1">
              Enroll Now
            </Button>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
