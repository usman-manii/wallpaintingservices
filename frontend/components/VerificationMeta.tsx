// frontend/components/VerificationMeta.tsx
'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

interface VerificationSettings {
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  yandexSiteVerification?: string;
  pinterestVerification?: string;
  facebookDomainVerification?: string;
  customVerificationTag?: string;
}

export default function VerificationMeta() {
  const [verification, setVerification] = useState<VerificationSettings>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fetch public settings to get verification codes
    (async () => {
      try {
        const res = await fetch(`${API_URL}/settings/public`);
        if (!res.ok) {
          console.error('Failed to load verification settings: HTTP', res.status);
          return;
        }
        const data = await res.json();
        setVerification({
          googleSiteVerification: data.googleSiteVerification,
          bingSiteVerification: data.bingSiteVerification,
          yandexSiteVerification: data.yandexSiteVerification,
          pinterestVerification: data.pinterestVerification,
          facebookDomainVerification: data.facebookDomainVerification,
          customVerificationTag: data.customVerificationTag,
        });
      } catch (err) {
        console.error('Failed to load verification settings:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;

    // Remove existing verification meta tags
    const existingTags = document.querySelectorAll('meta[name*="verification"], meta[name="p:domain_verify"], meta[name="facebook-domain-verification"]');
    existingTags.forEach(tag => tag.remove());

    // Inject verification meta tags dynamically
    const head = document.head;

    if (verification.googleSiteVerification) {
      const googleMeta = document.createElement('meta');
      googleMeta.name = 'google-site-verification';
      googleMeta.content = verification.googleSiteVerification;
      head.appendChild(googleMeta);
    }

    if (verification.bingSiteVerification) {
      const bingMeta = document.createElement('meta');
      bingMeta.name = 'msvalidate.01';
      bingMeta.content = verification.bingSiteVerification;
      head.appendChild(bingMeta);
    }

    if (verification.yandexSiteVerification) {
      const yandexMeta = document.createElement('meta');
      yandexMeta.name = 'yandex-verification';
      yandexMeta.content = verification.yandexSiteVerification;
      head.appendChild(yandexMeta);
    }

    if (verification.pinterestVerification) {
      const pinterestMeta = document.createElement('meta');
      pinterestMeta.name = 'p:domain_verify';
      pinterestMeta.content = verification.pinterestVerification;
      head.appendChild(pinterestMeta);
    }

    if (verification.facebookDomainVerification) {
      const facebookMeta = document.createElement('meta');
      facebookMeta.name = 'facebook-domain-verification';
      facebookMeta.content = verification.facebookDomainVerification;
      head.appendChild(facebookMeta);
    }

    // Handle custom verification tag (can be full HTML or just content)
    if (verification.customVerificationTag) {
      const customTag = verification.customVerificationTag.trim();
      
      // Check if it's a full HTML meta tag or just content value
      if (customTag.startsWith('<meta')) {
        // It's full HTML - parse and inject
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = customTag;
        const metaElement = tempDiv.querySelector('meta');
        if (metaElement) {
          head.appendChild(metaElement.cloneNode(true));
        }
      } else {
        // It's just content - create generic meta tag
        // Look for common patterns to determine the name attribute
        const customMeta = document.createElement('meta');
        
        // Try to detect verification type from content format
        if (customTag.includes('baidu') || customTag.length === 16) {
          customMeta.name = 'baidu-site-verification';
        } else if (customTag.includes('naver')) {
          customMeta.name = 'naver-site-verification';
        } else {
          // Generic custom verification
          customMeta.name = 'site-verification';
        }
        
        customMeta.content = customTag;
        head.appendChild(customMeta);
      }
    }
  }, [verification, loaded]);

  return null; // This component doesn't render anything
}
