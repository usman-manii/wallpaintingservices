'use client';

import logger from '@/lib/logger';

import { useEffect, useMemo, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/error-utils';
import { Bell, Filter, Plus, Send, Archive, Trash2, Pencil, RefreshCw } from 'lucide-react';

const DEFAULT_FORM = {
  title: '',
  message: '',
  category: 'ALERT',
  type: 'INFO',
  priority: 'NORMAL',
  status: 'DRAFT',
  audience: 'ALL',
  channels: ['IN_APP'] as string[],
  targetRoles: [] as string[],
  targetUserIds: [] as string[],
  actionLabel: '',
  actionUrl: '',
  sendAt: '',
  expiresAt: '',
  isSticky: false,
};

const ROLE_OPTIONS = [
  { value: 'SUBSCRIBER', label: 'Subscriber' },
  { value: 'CONTRIBUTOR', label: 'Contributor' },
  { value: 'AUTHOR', label: 'Author' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'ADMINISTRATOR', label: 'Administrator' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const CATEGORY_OPTIONS = [
  { value: 'ALERT', label: 'Alert' },
  { value: 'CAMPAIGN', label: 'Campaign' },
  { value: 'GREETING', label: 'Greeting' },
  { value: 'UPDATE', label: 'Update' },
];

const TYPE_OPTIONS = [
  { value: 'INFO', label: 'Info' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'ERROR', label: 'Error' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'SECURITY', label: 'Security' },
];

const CHANNEL_OPTIONS = [
  { value: 'IN_APP', label: 'In-app' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'BROWSER', label: 'Browser Push' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'All users' },
  { value: 'ROLE', label: 'By role' },
  { value: 'USER', label: 'Specific users' },
];

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const toInputDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  category: string;
  type: string;
  priority: string;
  status: string;
  audience: string;
  channels: string[];
  targetRoles: string[];
  targetUserIds: string[];
  actionLabel?: string | null;
  actionUrl?: string | null;
  isSticky?: boolean;
  sendAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  recipientCount?: number;
  unreadCount?: number;
  createdBy?: { id?: string; email?: string; username?: string; displayName?: string };
};

type NotificationStats = {
  total: number;
  draft: number;
  scheduled: number;
  sent: number;
  archived: number;
};

type UserOption = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export default function NotificationsPage() {
  const { success, error: showError, warning } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, draft: 0, scheduled: 0, sent: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    browserEnabled: false,
    requireBrowserOptIn: true,
  });
  const [browserOptIn, setBrowserOptIn] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', type: '', priority: '', audience: '' });
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const parseNotifications = (value: unknown) => {
    if (!isRecord(value) || !Array.isArray(value.data)) return { items: [], totalPages: 1 };
    const items = value.data
      .map((item) => {
        if (!isRecord(item)) return null;
        const id = typeof item.id === 'string' ? item.id : '';
        if (!id) return null;
        return {
          id,
          title: typeof item.title === 'string' ? item.title : 'Untitled',
          message: typeof item.message === 'string' ? item.message : '',
          category: typeof item.category === 'string' ? item.category : 'ALERT',
          type: typeof item.type === 'string' ? item.type : 'INFO',
          priority: typeof item.priority === 'string' ? item.priority : 'NORMAL',
          status: typeof item.status === 'string' ? item.status : 'DRAFT',
          audience: typeof item.audience === 'string' ? item.audience : 'ALL',
          channels: Array.isArray(item.channels) ? item.channels as string[] : ['IN_APP'],
          targetRoles: Array.isArray(item.targetRoles) ? item.targetRoles as string[] : [],
          targetUserIds: Array.isArray(item.targetUserIds) ? item.targetUserIds as string[] : [],
          actionLabel: typeof item.actionLabel === 'string' ? item.actionLabel : null,
          actionUrl: typeof item.actionUrl === 'string' ? item.actionUrl : null,
          isSticky: typeof item.isSticky === 'boolean' ? item.isSticky : false,
          sendAt: typeof item.sendAt === 'string' ? item.sendAt : null,
          expiresAt: typeof item.expiresAt === 'string' ? item.expiresAt : null,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
          recipientCount: typeof item.recipientCount === 'number' ? item.recipientCount : undefined,
          unreadCount: typeof item.unreadCount === 'number' ? item.unreadCount : undefined,
          createdBy: isRecord(item.createdBy) ? item.createdBy as NotificationItem['createdBy'] : undefined,
        } as NotificationItem;
      })
      .filter((item): item is NotificationItem => !!item);

    const pages = typeof value.totalPages === 'number' ? value.totalPages : 1;
    return { items, totalPages: Math.max(1, pages) };
  };

  const parseStats = (value: unknown): NotificationStats => {
    if (!isRecord(value)) return { total: 0, draft: 0, scheduled: 0, sent: 0, archived: 0 };
    return {
      total: typeof value.total === 'number' ? value.total : 0,
      draft: typeof value.draft === 'number' ? value.draft : 0,
      scheduled: typeof value.scheduled === 'number' ? value.scheduled : 0,
      sent: typeof value.sent === 'number' ? value.sent : 0,
      archived: typeof value.archived === 'number' ? value.archived : 0,
    };
  };

  const parseUsers = (value: unknown): UserOption[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!isRecord(item)) return null;
        const id = typeof item.id === 'string' ? item.id : '';
        const email = typeof item.email === 'string' ? item.email : '';
        if (!id || !email) return null;
        const name = typeof item.displayName === 'string'
          ? item.displayName
          : typeof item.firstName === 'string' || typeof item.lastName === 'string'
          ? `${item.firstName || ''} ${item.lastName || ''}`.trim()
          : typeof item.username === 'string'
          ? item.username
          : email;
        return {
          id,
          email,
          name: name || email,
          role: typeof item.role === 'string' ? item.role : 'SUBSCRIBER',
        } as UserOption;
      })
      .filter((item): item is UserOption => !!item);
  };

  const loadStats = async () => {
    try {
      const data = await fetchAPI('/notifications/admin/stats', { redirectOn401: false, cache: 'no-store' });
      setStats(parseStats(data));
    } catch (err) {
      logger.error('Failed to load notification stats', err, { component: 'NotificationsPage' });
    }
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
    } catch (err) {
      logger.error('Failed to load notification config', err, { component: 'NotificationsPage' });
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.type) params.set('type', filters.type);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.audience) params.set('audience', filters.audience);

      const data = await fetchAPI(`/notifications/admin?${params.toString()}`, { redirectOn401: false, cache: 'no-store' });
      const parsed = parseNotifications(data);
      setNotifications(parsed.items);
      setTotalPages(parsed.totalPages);
    } catch (err) {
      logger.error('Failed to load notifications', err, { component: 'NotificationsPage' });
      showError(getErrorMessage(err, 'Failed to load notifications'));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchAPI('/auth/users', { redirectOn401: false, cache: 'no-store' });
      setUsers(parseUsers(data));
    } catch (err) {
      logger.error('Failed to load users', err, { component: 'NotificationsPage' });
    }
  };

  useEffect(() => {
    loadStats();
    loadNotificationConfig();
    const storedOptIn = typeof window !== 'undefined' ? window.localStorage.getItem('browser_notifications_opt_in') : null;
    setBrowserOptIn(storedOptIn === 'true');
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [page, filters]);

  useEffect(() => {
    if (form.audience === 'USER' && users.length === 0) {
      loadUsers();
    }
  }, [form.audience, users.length]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const term = userSearch.toLowerCase();
    return users.filter((user) => (
      user.email.toLowerCase().includes(term) || user.name.toLowerCase().includes(term)
    ));
  }, [users, userSearch]);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  };

  const saveNotificationConfig = async () => {
    try {
      setConfigSaving(true);
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ notificationConfig: notificationConfig }),
        redirectOn401: false,
      });
      success('Notification channels updated.');
    } catch (err) {
      showError(getErrorMessage(err, 'Failed to update notification channels'));
    } finally {
      setConfigSaving(false);
    }
  };

  const toggleBrowserOptIn = async () => {
    if (!notificationConfig.browserEnabled) {
      warning('Enable browser notifications in channels config first.');
      return;
    }

    if (!browserOptIn) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await window.Notification.requestPermission();
        if (permission !== 'granted') {
          warning('Browser permission denied.');
          return;
        }
      }
    }

    const next = !browserOptIn;
    setBrowserOptIn(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('browser_notifications_opt_in', next ? 'true' : 'false');
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      warning('Title and message are required.');
      return;
    }

    if (form.audience === 'ROLE' && form.targetRoles.length === 0) {
      warning('Select at least one role for role-based notifications.');
      return;
    }

    if (form.audience === 'USER' && form.targetUserIds.length === 0) {
      warning('Select at least one user for user-specific notifications.');
      return;
    }

    if (form.status === 'SCHEDULED' && !form.sendAt) {
      warning('Scheduled notifications require a send time.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      category: form.category,
      type: form.type,
      priority: form.priority,
      status: form.status,
      audience: form.audience,
      channels: form.channels,
      targetRoles: form.targetRoles,
      targetUserIds: form.targetUserIds,
      actionLabel: form.actionLabel.trim() || null,
      actionUrl: form.actionUrl.trim() || null,
      sendAt: form.sendAt ? new Date(form.sendAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isSticky: form.isSticky,
    };

    try {
      setSaving(true);
      if (editingId) {
        await fetchAPI(`/notifications/admin/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
          redirectOn401: false,
        });
        success('Notification updated.');
      } else {
        await fetchAPI('/notifications/admin', {
          method: 'POST',
          body: JSON.stringify(payload),
          redirectOn401: false,
        });
        success('Notification created.');
      }
      resetForm();
      loadNotifications();
      loadStats();
    } catch (err) {
      showError(getErrorMessage(err, 'Failed to save notification'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (notification: NotificationItem) => {
    setEditingId(notification.id);
    setForm({
      title: notification.title,
      message: notification.message,
      category: notification.category,
      type: notification.type,
      priority: notification.priority,
      status: notification.status,
      audience: notification.audience,
      channels: notification.channels || ['IN_APP'],
      targetRoles: notification.targetRoles || [],
      targetUserIds: notification.targetUserIds || [],
      actionLabel: notification.actionLabel || '',
      actionUrl: notification.actionUrl || '',
      sendAt: toInputDateTime(notification.sendAt),
      expiresAt: toInputDateTime(notification.expiresAt),
      isSticky: notification.isSticky || false,
    });
  };

  const handlePublish = async (id: string) => {
    try {
      await fetchAPI(`/notifications/admin/${id}/publish`, { method: 'POST', redirectOn401: false });
      success('Notification published.');
      loadNotifications();
      loadStats();
    } catch (err) {
      showError(getErrorMessage(err, 'Failed to publish notification'));
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await fetchAPI(`/notifications/admin/${id}/archive`, { method: 'POST', redirectOn401: false });
      success('Notification archived.');
      loadNotifications();
      loadStats();
    } catch (err) {
      showError(getErrorMessage(err, 'Failed to archive notification'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification permanently?')) return;
    try {
      await fetchAPI(`/notifications/admin/${id}`, { method: 'DELETE', redirectOn401: false });
      success('Notification deleted.');
      loadNotifications();
      loadStats();
    } catch (err) {
      showError(getErrorMessage(err, 'Failed to delete notification'));
    }
  };

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((value) => value !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const toggleUser = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      targetUserIds: prev.targetUserIds.includes(userId)
        ? prev.targetUserIds.filter((value) => value !== userId)
        : [...prev.targetUserIds, userId],
    }));
  };

  const badgeForStatus = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'success';
      case 'SCHEDULED':
        return 'warning';
      case 'ARCHIVED':
        return 'outline';
      default:
        return 'default';
    }
  };

  const badgeForType = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return 'success';
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'error';
      case 'SECURITY':
        return 'pink';
      case 'SYSTEM':
        return 'purple';
      default:
        return 'info';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Comms Hub</h1>
          </div>
          <p className="text-muted-foreground mt-2">Manage notifications, campaigns, and greetings from one command center.</p>
        </div>
        <Button variant="outline" onClick={() => { loadNotifications(); loadStats(); }}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Drafts</p>
            <p className="text-2xl font-bold text-foreground">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-foreground">{stats.scheduled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sent</p>
            <p className="text-2xl font-bold text-foreground">{stats.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Archived</p>
            <p className="text-2xl font-bold text-foreground">{stats.archived}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={notificationConfig.inAppEnabled}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, inAppEnabled: e.target.checked })}
                className="h-4 w-4"
              />
              In-app notifications
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={notificationConfig.emailEnabled}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, emailEnabled: e.target.checked })}
                className="h-4 w-4"
              />
              Email delivery
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={notificationConfig.browserEnabled}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, browserEnabled: e.target.checked })}
                className="h-4 w-4"
              />
              Browser notifications
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={notificationConfig.requireBrowserOptIn}
                onChange={(e) => setNotificationConfig({ ...notificationConfig, requireBrowserOptIn: e.target.checked })}
                className="h-4 w-4"
              />
              Require user opt-in
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={toggleBrowserOptIn}>
              {browserOptIn ? 'Disable browser notifications' : 'Enable browser notifications'}
            </Button>
            <Button onClick={saveNotificationConfig} isLoading={configSaving}>
              Save channel settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {editingId ? 'Edit Notification' : 'Create Notification'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Quarterly compliance update"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground min-h-[110px]"
              placeholder="Share the details of the alert or update."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value, targetRoles: [], targetUserIds: [] })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
              >
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-7">
              <input
                type="checkbox"
                checked={form.isSticky}
                onChange={(e) => setForm({ ...form, isSticky: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">Sticky</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Delivery Channels</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <label key={channel.value} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.channels.includes(channel.value)}
                    onChange={() => {
                      setForm((prev) => ({
                        ...prev,
                        channels: prev.channels.includes(channel.value)
                          ? prev.channels.filter((value) => value !== channel.value)
                          : [...prev.channels, channel.value],
                      }));
                    }}
                    className="h-4 w-4"
                  />
                  {channel.label}
                </label>
              ))}
            </div>
          </div>

          {form.audience === 'ROLE' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Roles</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <label key={role.value} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.targetRoles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="h-4 w-4"
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.audience === 'USER' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Users</label>
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email"
                className="mb-3"
              />
              <div className="border border-input rounded-lg bg-background max-h-48 overflow-y-auto p-3 space-y-2">
                {filteredUsers.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={form.targetUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="h-4 w-4"
                    />
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">({user.email})</span>
                  </label>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground">No users match your search.</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Send At (optional)</label>
              <Input
                type="datetime-local"
                value={form.sendAt}
                onChange={(e) => setForm({ ...form, sendAt: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Expires At (optional)</label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Action Label</label>
              <Input
                value={form.actionLabel}
                onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
                placeholder="View details"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Action URL</label>
              <Input
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="/dashboard/seo"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} isLoading={saving}>
              {editingId ? 'Update Notification' : 'Create Notification'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Notification Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search notifications"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
            >
              <option value="">All types</option>
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filters.audience}
              onChange={(e) => setFilters({ ...filters, audience: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-input text-foreground"
            >
              <option value="">All audiences</option>
              {AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No notifications found.</div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border border-border rounded-lg p-4 bg-background">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">{notification.title}</h3>
                        <Badge variant="outline" size="sm">{notification.category}</Badge>
                        <Badge variant={badgeForType(notification.type)} size="sm">{notification.type}</Badge>
                        <Badge variant={badgeForStatus(notification.status)} size="sm">{notification.status}</Badge>
                        {notification.isSticky && <Badge variant="outline" size="sm">Sticky</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Priority: {notification.priority}</span>
                        <span>Audience: {notification.audience}</span>
                        <span>Channels: {notification.channels?.join(', ') || 'IN_APP'}</span>
                        {typeof notification.recipientCount === 'number' && (
                          <span>Recipients: {notification.recipientCount}</span>
                        )}
                        {typeof notification.unreadCount === 'number' && (
                          <span>Unread: {notification.unreadCount}</span>
                        )}
                        {notification.sendAt && (
                          <span>Send at: {new Date(notification.sendAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(notification)}>
                        <Pencil className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      {notification.status !== 'SENT' && (
                        <Button size="sm" onClick={() => handlePublish(notification.id)}>
                          <Send className="w-4 h-4 mr-1" /> Publish
                        </Button>
                      )}
                      {notification.status !== 'ARCHIVED' && (
                        <Button variant="outline" size="sm" onClick={() => handleArchive(notification.id)}>
                          <Archive className="w-4 h-4 mr-1" /> Archive
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(notification.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
