// frontend/components/Footer.tsx
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePublicSettings } from '@/contexts/SettingsContext';

type MenuItem = {
  id: string;
  label: string;
  url: string;
  order?: number;
};

type Menu = {
  id: string;
  locations?: { primary?: boolean; footer?: boolean };
  items?: MenuItem[];
};

type PublicSettings = {
  menuStructure?: {
    menus?: Menu[];
  };
};

function normalizeMenuUrl(url?: string): string {
  if (!url) return '#';
  if (url.startsWith('/pages/')) {
    const slug = url.replace('/pages/', '');
    if (slug === '(home)' || slug === 'home') return '/';
    return `/${slug}`;
  }
  return url;
}

export function Footer() {
  const { settings } = usePublicSettings();

  const footerLinks = useMemo(() => {
    if (!settings?.menuStructure?.menus) return [];
    
    const menus = Array.isArray(settings.menuStructure.menus) ? settings.menuStructure.menus : [];
    if (menus.length === 0) return [];

    const footerMenu = menus.find((m) => m.locations?.footer) || null;
    if (!footerMenu?.items) return [];

    const items = [...footerMenu.items];
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return items
      .filter((item) => item?.label && item?.url)
      .map((item) => ({
        href: normalizeMenuUrl(item.url),
        label: item.label,
      }));
  }, [settings]);

  return (
    <footer className="border-t border-border bg-card py-12" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4 text-foreground">AI CMS</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Empowering creators with AI-driven content management. Scalable, fast, and SEO-optimized.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">Home</Link></li>
              <li><Link href="/features" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">Pricing</Link></li>
            </ul>
          </div>
           <div>
            <h4 className="font-semibold mb-4 text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">About</Link></li>
              <li><Link href="/get-quote" className="hover:text-warning transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">Get a Quote</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">Contact</Link></li>
              <li><Link href="/sitemap.xml" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">Sitemap</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border text-muted-foreground text-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>&copy; {new Date().getFullYear()} AI CMS Platform. All rights reserved.</div>
          {footerLinks.length > 0 && (
            <nav className="flex flex-wrap items-center gap-4 justify-center sm:justify-end" aria-label="Footer navigation">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
