'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { ADMIN_ROLES, dashboardPathForRole, type Role } from '@/types/auth';

/**
 * Client-side route guard for dashboard areas.
 * - Redirects unauthenticated users to /login (preserving the return path).
 * - Enforces role access; sends users to their own dashboard if mismatched.
 */
export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  /** Allowed roles. Omit to allow any authenticated user. */
  roles?: Role[];
}) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user && roles && !roles.includes(user.role)) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [status, user, roles, router, pathname]);

  if (status !== 'authenticated' || (user && roles && !roles.includes(user.role))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-navy-500" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}

export { ADMIN_ROLES };
