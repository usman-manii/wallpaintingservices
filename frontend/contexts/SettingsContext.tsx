'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PublicSettings {
  [key: string]: any;
}

interface SettingsContextValue {
  settings: PublicSettings | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

// Singleton cache with promise to prevent race conditions
let settingsCache: PublicSettings | null = null;
let cacheTimestamp: number = 0;
let pendingFetch: Promise<PublicSettings> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchSettingsSingleton(): Promise<PublicSettings> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  // If there's already a fetch in progress, return that promise
  if (pendingFetch) {
    return pendingFetch;
  }

  // Start a new fetch
  pendingFetch = (async () => {
    try {
      const res = await fetch(`${API_URL}/settings/public`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch settings: ${res.status}`);
      }
      
      const data = await res.json();
      settingsCache = data;
      cacheTimestamp = now;
      return data;
    } catch (err) {
      console.error('Failed to load public settings:', err);
      throw err;
    } finally {
      pendingFetch = null;
    }
  })();

  return pendingFetch;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(settingsCache);
  const [loading, setLoading] = useState(!settingsCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchSettingsSingleton()
      .then(data => {
        if (mounted) {
          setSettings(data);
          setError(null);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err as Error);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const refetch = async () => {
    // Force refetch by clearing cache
    settingsCache = null;
    cacheTimestamp = 0;
    pendingFetch = null;
    
    setLoading(true);
    try {
      const data = await fetchSettingsSingleton();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetch }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function usePublicSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('usePublicSettings must be used within a SettingsProvider');
  }
  return context;
}
