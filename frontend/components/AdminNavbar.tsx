'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Bell, ChevronDown } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useEffect, useState, useRef } from 'react';
import { useAdminSession } from '@/contexts/AdminSessionContext';
import { fetchAPI } from '@/lib/api';
import logger from '@/lib/logger';

type NotificationItem = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  priority?: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  createdAt?: string;
  readAt?: string | null;
};

export default function AdminNavbar() {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationConfig, setNotificationConfig] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    browserEnabled: false,
    requireBrowserOptIn: true,
  });
  const [browserOptIn, setBrowserOptIn] = useState(false);
  const { user, logout } = useAdminSession();
  const lastUnreadRef = useRef(0);
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  const isRecord = (value: unknown): value is Record<string, unknown> => (
    value !== null && typeof value === 'object' && !Array.isArray(value)
  );

  const parseNotifications = (value: unknown): NotificationItem[] => {
    const items = isRecord(value) && Array.isArray(value.data)
      ? value.data
      : Array.isArray(value)
      ? value
      : [];

    return items
      .map((item) => {
        if (!isRecord(item)) return null;
        const id = typeof item.id === 'string' ? item.id : '';
        if (!id) return null;
        return {
          id,
          title: typeof item.title === 'string' ? item.title : undefined,
          message: typeof item.message === 'string' ? item.message : undefined,
          type: typeof item.type === 'string' ? item.type : undefined,
          priority: typeof item.priority === 'string' ? item.priority : undefined,
          actionLabel: typeof item.actionLabel === 'string' ? item.actionLabel : null,
          actionUrl: typeof item.actionUrl === 'string' ? item.actionUrl : null,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
          readAt: typeof item.readAt === 'string' ? item.readAt : null,
        } as NotificationItem;
      })
      .filter((item): item is NotificationItem => !!item);
  };

  const loadNotificationConfig = async () => {
    try {
      const data = await fetchAPI('/settings', { redirectOn401: false, cache: 'no-store' });
      if (isRecord(data) && isRecord(data.notificationConfig)) {
        const cfg = data.notificationConfig as Record<string, unknown>;
        setNotificationConfig({
          inAppEnabled: typeof cfg.inAppEnabled === 'boolean' ? cfg.inAppEnabled : true,
          emailEnabled: typeof cfg.emailEnabled === 'boolean' ? cfg.emailEnabled : true,
          browserEnabled: typeof cfg.browserEnabled === 'boolean' ? cfg.browserEnabled : false,
          requireBrowserOptIn: typeof cfg.requireBrowserOptIn === 'boolean' ? cfg.requireBrowserOptIn : true,
        });
      }
    } catch (error) {
      logger.warn('Failed to load notification config', { error });
    }
  };

  const loadBrowserOptIn = () => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('browser_notifications_opt_in');
    setBrowserOptIn(stored === 'true');
  };

  const canBrowserNotify = () => {
    if (!notificationConfig.browserEnabled) return false;
    if (notificationConfig.requireBrowserOptIn && !browserOptIn) return false;
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    return window.Notification.permission === 'granted';
  };

  const showBrowserNotification = (notification: NotificationItem) => {
    if (!canBrowserNotify()) return;
    try {
      const title = notification.title || 'Notification';
      const body = notification.message || 'New update available.';
      const browserNotification = new window.Notification(title, {
        body,
        tag: notification.id,
      });
      if (notification.actionUrl) {
        browserNotification.onclick = () => {
          window.open(notification.actionUrl!, notification.actionUrl!.startsWith('http') ? '_blank' : '_self');
          browserNotification.close();
        };
      }
    } catch (error) {
      logger.warn('Browser notification failed', { error });
    }
  };

  const notifyUnread = async () => {
    if (!canBrowserNotify()) return;
    try {
      const data = await fetchAPI('/notifications?limit=5&unreadOnly=true', { redirectOn401: false, cache: 'no-store' });
      const items = parseNotifications(data);
      items.forEach((item) => {
        if (!item.readAt && !notifiedIdsRef.current.has(item.id)) {
          notifiedIdsRef.current.add(item.id);
          showBrowserNotification(item);
        }
      });
    } catch (error) {
      logger.warn('Failed to load unread notifications for browser alerts', { error });
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await fetchAPI('/notifications/unread-count', { redirectOn401: false, cache: 'no-store' });
      if (isRecord(data) && typeof data.unread === 'number') {
        const nextUnread = data.unread;
        setUnreadCount(nextUnread);
        if (nextUnread > lastUnreadRef.current) {
          await notifyUnread();
        }
        lastUnreadRef.current = nextUnread;
      }
    } catch (error) {
      logger.warn('Failed to load unread notification count', { error });
    }
  };

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const data = await fetchAPI('/notifications?limit=6', { redirectOn401: false, cache: 'no-store' });
      setNotifications(parseNotifications(data));
    } catch (error) {
      logger.warn('Failed to load notifications', { error });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await fetchAPI(`/notifications/${id}/read`, { method: 'POST', redirectOn401: false });
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      logger.warn('Failed to mark notification read', { error });
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await fetchAPI(`/notifications/${id}/dismiss`, { method: 'POST', redirectOn401: false });
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      logger.warn('Failed to dismiss notification', { error });
    }
  };

  const markAllRead = async () => {
    try {
      await fetchAPI('/notifications/mark-all-read', { method: 'POST', redirectOn401: false });
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      logger.warn('Failed to mark all notifications read', { error });
    }
  };

  useEffect(() => {
    loadBrowserOptIn();
    loadNotificationConfig().finally(() => loadUnreadCount());
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);
  
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

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                const next = !notificationsOpen;
                setNotificationsOpen(next);
                setShowUserMenu(false);
                if (next) {
                  loadNotifications();
                }
              }}
              className="relative p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={notificationsOpen}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] px-1.5 h-[18px] text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-card rounded-lg shadow-elevation-3 border border-border overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">Latest updates and alerts</p>
                  </div>
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground">No notifications yet.</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-border last:border-0 ${notification.readAt ? '' : 'bg-primary/5'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {notification.title || 'Notification'}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message || 'No details provided.'}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                              {notification.type ? ` - ${notification.type}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {!notification.readAt && (
                              <button
                                onClick={() => markRead(notification.id)}
                                className="text-[11px] text-primary hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="text-[11px] text-muted-foreground hover:text-foreground"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                            target={notification.actionUrl.startsWith('http') ? '_blank' : undefined}
                            rel={notification.actionUrl.startsWith('http') ? 'noreferrer' : undefined}
                          >
                            {notification.actionLabel || 'Open'}
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-border px-4 py-2 text-right">
                  <Link
                    href="/dashboard/notifications"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Open Comms Hub
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button 
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setNotificationsOpen(false);
                }}
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
                        <p className="text-xs text-muted-foreground truncate">{user?.email || '-'}</p>
                    </div>
                    <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-foreground hover:bg-muted w-full text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
                        Settings
                    </Link>
                    <button 
                          onClick={async () => {
                            await logout();
                            router.replace('/login');
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

      {notificationsOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
    </header>
  );
}
