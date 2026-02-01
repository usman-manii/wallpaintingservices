'use client';

import { useMemo } from 'react';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { usePublicSettings } from '@/contexts/SettingsContext';

interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export function TopBar() {
  // Build-time feature flag: keep top bar off unless explicitly enabled.
  const topBarFeatureEnabled = process.env.NEXT_PUBLIC_ENABLE_TOP_BAR === 'true';
  const { settings } = usePublicSettings();

  const contactInfo = useMemo(() => {
    if (!settings?.contactInfo) return {};
    
    // Parse contactInfo if it's a string
    if (typeof settings.contactInfo === 'string') {
      try {
        return JSON.parse(settings.contactInfo) as ContactInfo;
      } catch {
        return {};
      }
    }
    return settings.contactInfo as ContactInfo;
  }, [settings]);

  // Feature flag wins first
  if (!topBarFeatureEnabled) {
    return null;
  }

  // Don't render if top bar is disabled or no contact info
  if (!settings.topBarEnabled) {
    return null;
  }

  const hasContactInfo = contactInfo.phone || contactInfo.email || contactInfo.address;
  const hasSocialMedia = contactInfo.facebook || contactInfo.twitter || contactInfo.instagram || 
                         contactInfo.linkedin || contactInfo.youtube;

  if (!hasContactInfo && !hasSocialMedia) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900 dark:bg-slate-950 text-white border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 text-sm">
          {/* Contact Information */}
          <div className="flex flex-wrap items-center gap-4">
            {contactInfo.phone && (
              <a 
                href={`tel:${contactInfo.phone}`}
                className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
              >
                <Phone size={14} />
                <span>{contactInfo.phone}</span>
              </a>
            )}
            {contactInfo.email && (
              <a 
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
              >
                <Mail size={14} />
                <span>{contactInfo.email}</span>
              </a>
            )}
            {contactInfo.address && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                <span>{contactInfo.address}</span>
              </div>
            )}
          </div>

          {/* Social Media Links */}
          {(hasSocialMedia) && (
            <div className="flex items-center gap-3">
              {contactInfo.facebook && (
                <a
                  href={contactInfo.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={16} />
                </a>
              )}
              {contactInfo.twitter && (
                <a
                  href={contactInfo.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter size={16} />
                </a>
              )}
              {contactInfo.instagram && (
                <a
                  href={contactInfo.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={16} />
                </a>
              )}
              {contactInfo.linkedin && (
                <a
                  href={contactInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={16} />
                </a>
              )}
              {contactInfo.youtube && (
                <a
                  href={contactInfo.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-400 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube size={16} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
