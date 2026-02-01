'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, Bell, User, Search, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useState } from 'react';
import { useAdminSession } from '@/contexts/AdminSessionContext';

export default function AdminNavbar() {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAdminSession();
  
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md">
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
          <Link href="/" target="_blank" className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink size={16} />
            View Site
          </Link>

          <div className="h-6 w-px bg-border hidden md:block" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications (Mock) */}
          <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="User menu"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
            >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(user?.firstName?.[0] || user?.username?.[0] || 'A').toUpperCase()}
                </div>
                <ChevronDown size={16} className="text-muted-foreground" />
            </button>

            {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-elevation-3 border border-border py-1 overflow-hidden z-50">
                    <div className="px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium text-foreground">{user?.firstName || user?.username || 'Admin User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email || '—'}</p>
                    </div>
                    <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
                        Settings
                    </Link>
                    <button 
                          onClick={async () => {
                            await logout();
                            router.replace('/auth');
                        }}
                        className="block px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full text-left focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-inset"
                        aria-label="Logout from admin panel"
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
