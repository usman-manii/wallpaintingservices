'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  FileCode, 
  Sparkles,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  MessageSquare,
  Tags,
  Calendar,
  Search,
  Share2,
  Link as LinkIcon,
  Folder,
  Plus,
  BarChart3,
  Images,
  Palette,
  Menu as MenuIcon,
  Layout,
  Phone
} from 'lucide-react';
import { useState, createContext, useContext, useEffect } from 'react';
import { API_URL } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Posts', 
    href: '/dashboard/posts',
    icon: FileText,
    dropdown: [
      { name: 'All Posts', href: '/dashboard/posts', icon: FileText },
      { name: 'Add New Post', href: '/dashboard/posts/new', icon: Plus },
      { name: 'Tags', href: '/dashboard/tags', icon: Tags },
      { name: 'Categories', href: '/dashboard/categories', icon: Folder },
    ]
  },
  { name: 'Media', href: '/dashboard/media', icon: Images, roles: ['ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR'] },
  { 
    name: 'Pages', 
    href: '/dashboard/pages',
    icon: FileCode,
    roles: ['ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR'],
    dropdown: [
      { name: 'All Pages', href: '/dashboard/pages', icon: FileCode },
      { name: 'Add New Page', href: '/dashboard/pages/new/edit', icon: Plus },
    ]
  },
  { name: 'Comments', href: '/dashboard/comments', icon: MessageSquare },
  { name: 'Distribution', href: '/dashboard/distribution', icon: Share2 },
  { name: 'Feedback', href: '/dashboard/feedback', icon: BarChart3, roles: ['ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR'] },
  { name: 'Cron Jobs', href: '/dashboard/cron-jobs', icon: Clock, roles: ['ADMINISTRATOR', 'SUPER_ADMIN'] },
  { name: 'AI Content', href: '/dashboard/ai', icon: Sparkles, roles: ['ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR'] },
  { name: 'SEO Management', href: '/dashboard/seo', icon: Search, roles: ['ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR'], badge: 'NEW' },
  { 
    name: 'Appearance', 
    href: '/dashboard/appearance/menu',
    icon: Palette,
    roles: ['ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR'],
    dropdown: [
      { name: 'Menu', href: '/dashboard/appearance/menu', icon: MenuIcon },
      { name: 'Widgets', href: '/dashboard/appearance/widgets', icon: Layout },
      { name: 'Customize', href: '/dashboard/appearance/customize', icon: Palette },
    ]
  },
  { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['ADMINISTRATOR', 'SUPER_ADMIN'] },
      { 
        name: 'Settings', 
        href: '/dashboard/settings',
        icon: Settings,
        roles: ['ADMINISTRATOR', 'SUPER_ADMIN'],
        dropdown: [
          { name: 'General', href: '/dashboard/settings', icon: Settings },
          { name: 'Contact Info', href: '/dashboard/settings/contact-info', icon: Phone },
        ]
      },
];

function getRoleFromToken(): string | null {
  // Role now comes from server session cookie; we can't decode httpOnly cookie client-side.
  // Fallback: keep existing localStorage role if present during transition.
  if (typeof window === 'undefined') return null;
  const role = localStorage.getItem('user_role');
  return role;
}

// Context for sidebar state
const SidebarContext = createContext({ isCollapsed: false, toggleCollapse: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]); // All dropdowns closed by default

  useEffect(() => {
      setRole(getRoleFromToken());
      // Auto-open dropdowns based on current path
      if (pathname.startsWith('/dashboard/posts') || pathname.startsWith('/dashboard/tags') || pathname.startsWith('/dashboard/categories') || pathname.startsWith('/dashboard/media')) {
        setOpenDropdowns(['Posts']);
      }
      if (pathname.startsWith('/dashboard/pages')) {
        setOpenDropdowns(['Pages']);
      }
      if (pathname.startsWith('/dashboard/appearance')) {
        setOpenDropdowns(['Appearance']);
      }
      if (pathname.startsWith('/dashboard/settings')) {
        setOpenDropdowns(['Settings']);
      }
  }, [pathname]);

  const handleLogout = async () => {
    localStorage.removeItem('user_role');
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore
    }
    window.location.href = '/auth';
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-slate-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900 dark:bg-slate-950 text-white flex flex-col transform transition-all duration-300 ease-in-out z-50 border-r border-slate-800 dark:border-slate-900 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Header */}
        <div className={`p-6 border-b border-slate-800 dark:border-slate-900 flex items-center justify-between ${isCollapsed ? 'p-4' : ''}`}>
          {!isCollapsed ? (
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-slate-400 mt-1">CMS Dashboard</p>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <LayoutDashboard size={24} />
            </div>
          )}
        </div>

        {/* Collapse Toggle Button - Desktop Only */}
        <button
          onClick={toggleCollapse}
          className={`hidden lg:flex absolute -right-3 top-20 bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-white rounded-full p-1.5 shadow-lg transition-all ${
            isCollapsed ? 'rotate-180' : ''
          }`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigation.filter(item => !item.roles || (role && item.roles.includes(role))).map((item) => {
              if (item.dropdown) {
                // Dropdown menu item
                const isOpen = openDropdowns.includes(item.name);
                const isAnyChildActive = item.dropdown.some(child => pathname === child.href);
                
                return (
                  <li key={item.name}>
                    {/* Main dropdown button/link - clickable to go to main page */}
                    <div className="relative">
                      <Link
                        href={item.href || item.dropdown[0].href}
                        onClick={(e) => {
                          setIsMobileMenuOpen(false);
                          // Don't prevent default, let the link navigate
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative w-full ${
                          isAnyChildActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon size={20} />
                        {!isCollapsed && (
                          <>
                            <span className="font-medium flex-1 text-left">{item.name}</span>
                          </>
                        )}
                        
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            {item.name}
                          </span>
                        )}
                      </Link>
                      
                      {/* Dropdown toggle button - separate from link */}
                      {!isCollapsed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(item.name);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      )}
                    </div>
                    
                    {/* Dropdown items */}
                    {isOpen && !isCollapsed && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {item.dropdown.map((child) => {
                          const isActive = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                                  isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                {ChildIcon && <ChildIcon size={16} />}
                                {child.name}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }
              
              // Regular menu item
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group relative ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon size={20} />
                    {!isCollapsed && (
                      <span className="font-medium flex items-center gap-2">
                        {item.name}
                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded uppercase">
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {item.name} {item.badge && `(${item.badge})`}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className={`p-4 border-t border-slate-800 dark:border-slate-900 ${isCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 w-full rounded-lg text-slate-300 hover:bg-slate-800 dark:hover:bg-slate-900 hover:text-white transition-colors group relative ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">Logout</span>}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 dark:bg-slate-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </SidebarContext.Provider>
  );
}
