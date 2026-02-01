'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, Bell, User, Search, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState } from 'react';
import { useAdminSession } from '@/contexts/AdminSessionContext';

export default function AdminNavbar() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAdminSession();
  
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left Side: Breadcrumbs */}
        <div className="flex items-center">
             {/* Mobile menu trigger could go here if we refactored sidebar state */}
             <div className="-ml-2 mr-4">
                 <Breadcrumbs />
             </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          
          {/* View Website */}
          <Link href="/" target="_blank" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <ExternalLink size={16} />
            View Site
          </Link>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications (Mock) */}
          <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    {(user?.firstName?.[0] || user?.username?.[0] || 'A').toUpperCase()}
                </div>
                <ChevronDown size={16} className="text-slate-500" />
            </button>

            {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 overflow-hidden z-50">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.firstName || user?.username || 'Admin User'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || '—'}</p>
                    </div>
                    <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 w-full text-left">
                        Settings
                    </Link>
                    <button 
                          onClick={async () => {
                            await logout();
                            window.location.href = '/auth';
                        }}
                        className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                    >
                        Logout
                    </button>
                </div>
            )}
            
            {/* Backdrop for click outside */}
            {showUserMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
