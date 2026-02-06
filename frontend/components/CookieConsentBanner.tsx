'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePublicSettings } from '@/contexts/SettingsContext';

const STORAGE_KEY = 'cookie_consent_v1';

type ConsentState = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

type ConsentConfig = {
  title: string;
  description: string;
  policyUrl?: string;
};

const DEFAULT_CONFIG: ConsentConfig = {
  title: 'Cookie Preferences',
  description: 'We use cookies to enhance performance, analyze traffic, and personalize your experience. You can update your preferences at any time.',
  policyUrl: '/privacy-policy',
};

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export default function CookieConsentBanner() {
  const { settings } = usePublicSettings();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);

  const config: ConsentConfig = {
    ...DEFAULT_CONFIG,
    ...(settings?.cookieConsentConfig as Partial<ConsentConfig> | undefined),
  };

  const enabled = typeof settings?.cookieConsentEnabled === 'boolean' ? settings.cookieConsentEnabled : true;

  useEffect(() => {
    if (!enabled) return;
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!stored) {
      setVisible(true);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { consent?: ConsentState };
      if (parsed?.consent) {
        setConsent({ ...DEFAULT_CONSENT, ...parsed.consent, necessary: true });
      }
    } catch {
      setVisible(true);
    }
  }, [enabled]);

  const persist = (nextConsent: ConsentState) => {
    const payload = {
      consent: nextConsent,
      updatedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      document.cookie = `cookie_consent=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  };

  const handleAcceptAll = () => {
    const next = { necessary: true, analytics: true, marketing: true, preferences: true };
    setConsent(next);
    persist(next);
    setVisible(false);
  };

  const handleReject = () => {
    const next = { necessary: true, analytics: false, marketing: false, preferences: false };
    setConsent(next);
    persist(next);
    setVisible(false);
  };

  const handleSave = () => {
    const next = { ...consent, necessary: true };
    setConsent(next);
    persist(next);
    setVisible(false);
  };

  if (!enabled || !visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <Card className="mx-auto max-w-4xl p-6 shadow-elevation-3 border border-border bg-card">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
          </div>

          {expanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="h-4 w-4" />
                Necessary (always on)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  className="h-4 w-4"
                />
                Analytics
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={consent.preferences}
                  onChange={(e) => setConsent({ ...consent, preferences: e.target.checked })}
                  className="h-4 w-4"
                />
                Preferences
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  className="h-4 w-4"
                />
                Marketing
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Hide details' : 'Manage preferences'}
              </Button>
              {config.policyUrl && (
                <a href={config.policyUrl} className="text-xs text-primary hover:underline">
                  Privacy policy
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleReject}>Reject non-essential</Button>
              <Button variant="outline" onClick={handleSave}>Save choices</Button>
              <Button onClick={handleAcceptAll}>Accept all</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
