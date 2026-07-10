'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken } from '@/lib/api';
import type { AuthStatus, AuthUser } from '@/types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Called after a successful login (token + user in hand). */
  signIn: (accessToken: string, user: AuthUser) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // On first load, try to restore a session via the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const refreshRes = await api.post('/auth/refresh');
        const token = refreshRes.data?.data?.accessToken;
        if (!token) throw new Error('no token');
        setAccessToken(token);
        const meRes = await api.get('/auth/me');
        if (active) {
          setUser(meRes.data.data);
          setStatus('authenticated');
        }
      } catch {
        if (active) {
          setAccessToken(null);
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((accessToken: string, nextUser: AuthUser) => {
    setAccessToken(accessToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const refreshUser = useCallback(async () => {
    const meRes = await api.get('/auth/me');
    setUser(meRes.data.data);
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut, refreshUser }),
    [user, status, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
