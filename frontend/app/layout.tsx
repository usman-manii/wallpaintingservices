// frontend/app/layout.tsx
// Removed aggressive cache-busting that was causing performance issues
// Pages can set their own revalidation strategies as needed

import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { GoogleAnalytics, GoogleTagManager } from '@/components/Analytics';
import VerificationMeta from '@/components/VerificationMeta';
import { UserSessionProvider } from '@/contexts/UserSessionContext';
import SettingsProvider from '@/contexts/SettingsContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Wall Painting Services',
    default: 'Wall Painting Services - Professional Interior & Exterior Painting',
  },
  description: 'Expert wall painting services for residential and commercial properties. Professional painters delivering quality results with premium materials and techniques.',
  keywords: ['wall painting', 'painting services', 'interior painting', 'exterior painting', 'professional painters', 'house painting'],
  authors: [{ name: 'Wall Painting Services', url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' }],
  creator: 'Wall Painting Services',
  publisher: 'Wall Painting Services',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'Wall Painting Services',
    title: 'Wall Painting Services - Professional Painting Solutions',
    description: 'Expert wall painting services for residential and commercial properties.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Wall Painting Services',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wallpaintingservices',
    creator: '@wallpaintingservices',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const gtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'} />
        
        {/* DNS Prefetch & Preconnect for Performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Alternate Language Links (if multilingual) */}
        <link rel="alternate" hrefLang="en" href={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'} />
        
        {/* Theme Color for Mobile Browsers */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />

        {/* Prevent theme flash on initial paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=localStorage.getItem('theme');var systemDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var useDark=theme==='dark'||((!theme||theme==='system')&&systemDark);if(useDark){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        
        {/* Analytics */}
        {gaId && <GoogleAnalytics gaId={gaId} />}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
      </head>
      <body 
        className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/10 selection:text-primary transition-colors duration-200"
        suppressHydrationWarning
      >
        <UserSessionProvider>
          <SettingsProvider>
            <ThemeProvider>
              <ToastProvider>
                <VerificationMeta />
                <ClientLayoutWrapper>
                  {children}
                </ClientLayoutWrapper>
              </ToastProvider>
            </ThemeProvider>
          </SettingsProvider>
        </UserSessionProvider>
      </body>
    </html>
  );
}
