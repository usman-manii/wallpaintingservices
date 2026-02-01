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

// PERFORMANCE FIX: Singleton cache to prevent redundant profile loads
let userProfileCache: User | null = null;
let userProfileCacheTimestamp = 0;
let pendingUserProfileFetch: Promise<User> | null = null;
const USER_PROFILE_CACHE_TTL = 60 * 1000; // 1 minute

async function fetchUserProfileSingleton(): Promise<User> {
  const now = Date.now();
  
  // Return cached profile if still valid
  if (userProfileCache && (now - userProfileCacheTimestamp) < USER_PROFILE_CACHE_TTL) {
    return userProfileCache;
  }
  
  // Return existing promise if fetch is in progress
  if (pendingUserProfileFetch) {
    return pendingUserProfileFetch;
  }
  
  // Start new fetch
  pendingUserProfileFetch = (async () => {
    try {
      const profile = await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: false });
      const normalized = (profile as any)?.user || profile || {};
      userProfileCache = normalized;
      userProfileCacheTimestamp = now;
      return normalized;
    } finally {
      pendingUserProfileFetch = null;
    }
  })();
  
  return pendingUserProfileFetch;
}

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(userProfileCache);
  const [role, setRole] = useState<string | null>(userProfileCache?.role || null);
  const [loading, setLoading] = useState(!userProfileCache);

  const loadProfile = useCallback(async () => {
    const normalized = await fetchUserProfileSingleton();
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
      // Clear state and cache
      setUser(null);
      setRole(null);
      userProfileCache = null;
      userProfileCacheTimestamp = 0;
      
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
