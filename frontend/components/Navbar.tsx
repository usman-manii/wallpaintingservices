// frontend/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Newspaper, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useUserSession } from '@/contexts/UserSessionContext';
import { usePublicSettings } from '@/contexts/SettingsContext';

type MenuLocations = {
  primary?: boolean;
  footer?: boolean;
};

type MenuItem = {
  id: string;
  label: string;
  url: string;
  order?: number;
};

type Menu = {
  id: string;
  name: string;
  locations?: MenuLocations;
  items?: MenuItem[];
};

type PublicSettings = {
  menuStructure?: {
    menus?: Menu[];
  };
};

function normalizeMenuUrl(url?: string): string {
  if (!url) return '#';
  // Backward compatibility: older menu items stored /pages/{slug}
  if (url.startsWith('/pages/')) {
    const slug = url.replace('/pages/', '');
    if (slug === '(home)' || slug === 'home') return '/';
    return `/${slug}`;
  }
  return url;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith('/dashboard') || pathname.startsWith('/settings');
  const { role, loading } = useUserSession();
  const { settings } = usePublicSettings();

  const navLinks = useMemo(() => {
    if (!settings?.menuStructure?.menus) return [];
    
    const menus = Array.isArray(settings.menuStructure.menus) ? settings.menuStructure.menus : [];
    if (menus.length === 0) return [];

    const primaryMenu =
      menus.find((m) => m.locations?.primary) ||
      menus.find((m) => m.id === 'main') ||
      menus[0];

    if (!primaryMenu?.items) return [];

    const items = [...primaryMenu.items];
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return items
      .filter((item) => item?.label && item?.url)
      .map((item) => ({
        href: normalizeMenuUrl(item.url),
        label: item.label,
      }));
  }, [settings]);

  return (
    <nav 
      className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-elevation-1 transition-all duration-200"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NavLink 
          href="/" 
          className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          onNavigate={router.push}
          ariaLabel="AI CMS - Home"
        >
          <div className="bg-primary text-primary-foreground p-1 rounded-lg shadow-elevation-1">
            <Newspaper size={20} aria-hidden="true" />
          </div>
          <span>AI CMS</span>
        </NavLink>
        
        <div className="hidden md:flex gap-8" role="menubar" aria-label="Primary menu">
          {navLinks.map((link) => (
            <NavLink 
              key={link.href}
              href={link.href}
              onNavigate={router.push}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md px-2 py-1",
                pathname === link.href ? "text-primary font-semibold" : "text-muted-foreground"
              )}
              ariaLabel={link.label}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <NavLink href="/get-quote" onNavigate={router.push}>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold" ariaLabel="Get a Quote">
              Get a Quote
            </Button>
          </NavLink>
          <div className="w-px h-6 bg-border hidden sm:block" aria-hidden="true" />
          <ThemeToggle />
          
          {/* Auth Buttons: Login/Sign Up or Dashboard */}
          {loading ? (
            <div className="flex items-center gap-2" role="status" aria-live="polite" aria-label="Loading user status">
              <div className="h-9 w-16 bg-muted animate-pulse rounded" />
              <div className="h-9 w-20 bg-muted animate-pulse rounded" />
              <span className="sr-only">Loading...</span>
            </div>
          ) : role ? (
            // User is logged in - show Dashboard button
            <NavLink href="/dashboard" onNavigate={router.push}>
              <Button variant="outline" className="flex items-center gap-2" ariaLabel="Go to Dashboard">
                <LayoutDashboard size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </NavLink>
          ) : (
            // User is not logged in - show Login and Sign Up buttons
            <div className="flex items-center gap-2" role="group" aria-label="Authentication">
              <NavLink href="/auth?mode=login" onNavigate={router.push}>
                <Button variant="outline" className="px-4" ariaLabel="Login to your account">
                  Login
                </Button>
              </NavLink>
              <NavLink href="/join-us" onNavigate={router.push}>
                <Button className="px-4" ariaLabel="Join the platform">
                  Join Us
                </Button>
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

type NavLinkProps = React.PropsWithChildren<{
  href: string;
  className?: string;
  onNavigate: (href: string) => void;
  ariaLabel?: string;
}>;

/**
 * Lightweight client-side nav link to avoid ambiguity with the Next.js Link
 * module shape when running under webpack + React 19. Falls back to normal
 * anchor for middle-click/open-in-new-tab.
 */
function NavLink({ href, className, children, onNavigate, ariaLabel }: NavLinkProps) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (
          e.defaultPrevented ||
          e.metaKey ||
          e.altKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.button !== 0 ||
          (e.currentTarget && e.currentTarget.target === '_blank')
        ) {
          return;
        }
        e.preventDefault();
        onNavigate(href);
      }}
    >
      {children}
    </a>
  );
}
