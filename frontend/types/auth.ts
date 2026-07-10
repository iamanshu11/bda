export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/** Roles allowed into the admin dashboard. */
export const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];

/** Where a user lands after login, based on role. */
export function dashboardPathForRole(role: Role): string {
  return ADMIN_ROLES.includes(role) ? '/admin' : '/dashboard';
}

/** Defence-themed display label for a role. */
export function roleLabel(role: Role): string {
  const map: Record<Role, string> = {
    STUDENT: 'Cadet',
    FACULTY: 'Commander',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
  };
  return map[role] ?? role;
}
