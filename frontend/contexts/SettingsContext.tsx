'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PublicSettings {
  siteName?: string;
  description?: string;
  logo?: string | null;
  darkMode?: boolean;
  captchaType?: string;
  recaptchaV2SiteKey?: string | null;
  recaptchaV3SiteKey?: string | null;
  homePageLayout?: string;
  homePageId?: string | null;
  blogPageId?: string | null;
  topBarEnabled?: boolean;
  googleSiteVerification?: string | null;
  bingSiteVerification?: string | null;
  yandexSiteVerification?: string | null;
  pinterestVerification?: string | null;
  facebookDomainVerification?: string | null;
  customVerificationTag?: string | null;
  menuStructure?: {
    menus?: Array<{
      id: string;
      name: string;
      locations?: { primary?: boolean; footer?: boolean };
      items: Array<{
        label?: string;
        url?: string;
        order?: number;
        [key: string]: unknown;
      }>;
    }>;
  } | null;
  [key: string]: unknown;
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
      logger.error('Failed to load public settings', err as Error);
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
  const fetchedRef = useRef(false); // Prevent double fetch in Strict Mode

  useEffect(() => {
    // CRITICAL: Prevent double fetches in React StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
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
