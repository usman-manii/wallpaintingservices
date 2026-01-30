'use client';

import AdminSidebar from '@/components/AdminSidebar';
import AdminNavbar from '@/components/AdminNavbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Cookie-based auth: we assume presence of session cookies; role cached locally for UX
    const role = localStorage.getItem('user_role');
    setUserRole(role);
    setIsAuthenticated(true);
    setIsLoading(false);

    const updateLayout = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setIsCollapsed(sidebar.classList.contains('w-20'));
      }
    };

    updateLayout();
    const observer = new MutationObserver(updateLayout);
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }

    return () => observer.disconnect();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sign in required</h1>
          <p className="text-slate-600 dark:text-slate-400">You need to sign in to access the dashboard.</p>
        </div>
        <button
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          onClick={() => router.push('/auth')}
        >
          Go to Sign In
        </button>
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
    <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}
