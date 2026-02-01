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
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NavLink href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-slate-100 hover:opacity-80 transition-opacity" onNavigate={router.push}>
          <div className="bg-blue-600 dark:bg-blue-500 text-white p-1 rounded-lg">
            <Newspaper size={20} />
          </div>
          <span>AI CMS</span>
        </NavLink>
        
        <div className="hidden md:flex gap-8">
          {navLinks.map((link) => (
            <NavLink 
              key={link.href}
              href={link.href}
              onNavigate={router.push}
              className={cn(
                "text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                pathname === link.href ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
              )}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <NavLink href="/get-quote" onNavigate={router.push}>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              Get a Quote
            </Button>
          </NavLink>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <ThemeToggle />
          <NavLink
            href="/dashboard"
            aria-label="Admin Dashboard"
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            onNavigate={(href) => {
              if (!loading && !role) {
                router.push(`/auth?next=${encodeURIComponent(href)}`);
                return;
              }
              router.push(href);
            }}
          >
            {isAdmin ? <LayoutDashboard size={20} className="text-blue-600 dark:text-blue-400" /> : <ShieldCheck size={20} />}
          </NavLink>
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
 * Lightweight client-side nav link to avoid any ambiguity with the Next.js Link
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
