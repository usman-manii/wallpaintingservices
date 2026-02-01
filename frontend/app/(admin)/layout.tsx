'use client';

import AdminSidebar from '@/components/AdminSidebar';
import AdminNavbar from '@/components/AdminNavbar';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSessionProvider, useAdminSession } from '@/contexts/AdminSessionContext';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, role, user, logout, refreshSession } = useAdminSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateLayout = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setIsCollapsed(sidebar.classList.contains('w-20'));
      }
    };
    
    // Initial check
    updateLayout();
    
    // Watch for sidebar class changes
    const sidebar = document.querySelector('aside');
    if (!sidebar) return;
    
    const observer = new MutationObserver(updateLayout);
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []); // Empty deps - only run once on mount

  // Reset redirect flag when pathname changes (user navigated somewhere new)
  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [pathname]);

  // Handle authentication redirects - Only redirect once per navigation
  useEffect(() => {
    // CRITICAL: Don't redirect if already redirected, still loading, or during SSR
    if (hasRedirectedRef.current || loading || typeof window === 'undefined') return;

    const isAdminRole = role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN' || role === 'EDITOR';

    // Redirect unauthenticated users to login
    if (!role) {
      hasRedirectedRef.current = true;
      const returnTo = pathname && pathname !== '/dashboard' ? pathname : '/dashboard';
      router.replace(`/auth?next=${encodeURIComponent(returnTo)}`);
      return;
    }

    // Redirect non-admin users to profile
    if (!isAdminRole) {
      hasRedirectedRef.current = true;
      router.replace('/profile');
      return;
    }
  }, [loading, role, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  const isAdminRole = role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN' || role === 'EDITOR';

  // Show loading state while redirecting
  if (!role || !isAdminRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">Redirecting...</div>
      </div>
    );
  }

  // Always show sidebar for authenticated users in dashboard
  // The Sidebar component itself filters items based on role
  const showSidebar = true;

  if (!showSidebar) {
    // Regular user layout (no sidebar)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  // Admin layout with sidebar
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <AdminSidebar />
      <main 
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <AdminNavbar />
        <div className="p-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AdminSessionProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </AdminSessionProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
