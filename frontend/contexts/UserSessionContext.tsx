'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { logoutEverywhere } from '@/lib/authClient';

type User = {
  id?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
};

type UserSessionContextType = {
  user: User | null;
  role: string | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserSessionContext = createContext<UserSessionContextType>({
  user: null,
  role: null,
  loading: true,
  refreshSession: async () => {},
  logout: async () => {},
});

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const profile = await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: false });
    const normalized = (profile as any)?.user || profile || {};
    const nextRole = normalized.role || null;
    setUser(normalized);
    setRole(nextRole);
  }, []); // STABLE: Empty deps - function never changes

  const refreshSession = useCallback(async () => {
    await fetchAPI('/auth/refresh', { method: 'POST', cache: 'no-store', redirectOn401: false });
    const profile = await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: false });
    const normalized = (profile as any)?.user || profile || {};
    const nextRole = normalized.role || null;
    setUser(normalized);
    setRole(nextRole);
  }, []); // STABLE: No deps needed

  const logout = useCallback(async () => {
    try {
      await logoutEverywhere();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state regardless of API call result
      setUser(null);
      setRole(null);
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_session');
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: NodeJS.Timeout | null = null;
    
    (async () => {
      try {
        await loadProfile();
      } catch (err) {
        if (!cancelled) {
          setUser(null);
          setRole(null);
          // Don't retry indefinitely - just set loading to false
          console.debug('[UserSession] Profile load failed:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    
    return () => {
      cancelled = true;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []); // STABLE: Only run once on mount

  return (
    <UserSessionContext.Provider value={{ user, role, loading, refreshSession, logout }}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  return useContext(UserSessionContext);
}
