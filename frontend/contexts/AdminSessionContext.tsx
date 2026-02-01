'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { logoutEverywhere } from '@/lib/authClient';

type AdminUser = {
  id?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

type AdminSessionContextType = {
  user: AdminUser | null;
  role: string | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionContextType>({
  user: null,
  role: null,
  loading: true,
  refreshSession: async () => {},
  logout: async () => {},
});

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const profile = await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: true });
    const normalized = (profile as any)?.user || profile || {};
    const nextRole = normalized.role || null;
    setUser(normalized);
    setRole(nextRole);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      await fetchAPI('/auth/refresh', { method: 'POST', cache: 'no-store', redirectOn401: true });
      await loadProfile();
    } catch (err) {
      setUser(null);
      setRole(null);
      throw err;
    }
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await logoutEverywhere();
    setUser(null);
    setRole(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_role');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadProfile();
      } catch {
        if (!cancelled) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  return (
    <AdminSessionContext.Provider value={{ user, role, loading, refreshSession, logout }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
