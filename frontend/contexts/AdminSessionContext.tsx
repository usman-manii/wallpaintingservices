'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

// PERFORMANCE FIX: Singleton cache to prevent redundant profile loads
let profileCache: AdminUser | null = null;
let profileCacheTimestamp = 0;
let pendingProfileFetch: Promise<AdminUser> | null = null;
const PROFILE_CACHE_TTL = 60 * 1000; // 1 minute

async function fetchProfileSingleton(): Promise<AdminUser> {
  const now = Date.now();
  
  // Return cached profile if still valid
  if (profileCache && (now - profileCacheTimestamp) < PROFILE_CACHE_TTL) {
    return profileCache;
  }
  
  // Return existing promise if fetch is in progress
  if (pendingProfileFetch) {
    return pendingProfileFetch;
  }
  
  // Start new fetch
  pendingProfileFetch = (async () => {
    try {
      const profile = await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: false });
      const normalized = (profile as any)?.user || profile || {};
      profileCache = normalized;
      profileCacheTimestamp = now;
      return normalized;
    } finally {
      pendingProfileFetch = null;
    }
  })();
  
  return pendingProfileFetch;
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(profileCache);
  const [role, setRole] = useState<string | null>(profileCache?.role || null);
  const [loading, setLoading] = useState(!profileCache);

  const loadProfile = useCallback(async () => {
    const normalized = await fetchProfileSingleton();
    const nextRole = normalized.role || null;
    setUser(normalized);
    setRole(nextRole);
  }, []); // STABLE: Empty deps - function never changes

  const refreshSession = useCallback(async () => {
    try {
      await fetchAPI('/auth/refresh', { method: 'POST', cache: 'no-store', redirectOn401: false });
      const profile = await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: false });
      const normalized = (profile as any)?.user || profile || {};
      const nextRole = normalized.role || null;
      setUser(normalized);
      setRole(nextRole);
    } catch (err) {
      setUser(null);
      setRole(null);
      throw err;
    }
  }, []); // STABLE: No deps needed

  const logout = useCallback(async () => {
    try {
      await logoutEverywhere();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and cache
      setUser(null);
      setRole(null);
      profileCache = null;
      profileCacheTimestamp = 0;
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_role');
        localStorage.removeItem('admin_session');
      }
      
      // Force redirect to auth page after logout
      if (typeof window !== 'undefined') {
        router.replace('/auth?mode=login');
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
          console.debug('[AdminSession] Profile load failed:', err);
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
    <AdminSessionContext.Provider value={{ user, role, loading, refreshSession, logout }}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
