'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TopBar } from '@/components/TopBar';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if we are in the admin dashboard (or any route that shouldn't have the public shell)
  // Also separately check /settings since it's an admin route (will redirect to /dashboard/settings)
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isSettingsRoute = pathname?.startsWith('/settings');
  const isAdminRoute = isDashboardRoute || isSettingsRoute;

  if (isAdminRoute) {
    // For admin routes, we render children directly. 
    // The (admin)/layout.tsx will handle the Sidebar/Navbar/Container structure.
    return <>{children}</>;
  }

  // For public routes, we wrap in the standard site layout
  return (
    <>
      <TopBar />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
      <Footer />
    </>
  );
}
