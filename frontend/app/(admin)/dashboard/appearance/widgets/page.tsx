'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { Save, ArrowLeft, FileText, TrendingUp, MessageSquare, Folder, User, Share2 } from 'lucide-react';
import logger from '@/lib/logger';
import { getErrorMessage } from '@/lib/error-utils';
import type { JsonValue } from '@/types/json';

interface Widget {
  id: string;
  type: string;
  name: string;
  description: string;
  enabled: boolean;
  settings?: Record<string, JsonValue>;
}

const availableWidgets: Widget[] = [
  { id: 'latest-posts', type: 'latest-posts', name: 'Latest Posts', description: 'Display the most recent blog posts', enabled: false },
  { id: 'trending-posts', type: 'trending-posts', name: 'Trending Posts', description: 'Show popular or trending posts', enabled: false },
  { id: 'latest-comments', type: 'latest-comments', name: 'Latest Comments', description: 'Display recent comments from readers', enabled: false },
  { id: 'category-archives', type: 'category-archives', name: 'Category Archives', description: 'List all post categories', enabled: false },
  { id: 'about-me', type: 'about-me', name: 'About Me', description: 'Show author or site owner information', enabled: false },
  { id: 'social-sharing', type: 'social-sharing', name: 'Social Sharing', description: 'Social media sharing buttons', enabled: false },
];

function extractSavedWidgets(value: unknown): Widget[] {
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  const widgetConfig = obj.widgetConfig && typeof obj.widgetConfig === 'object' ? (obj.widgetConfig as Record<string, unknown>) : null;
  const widgetsValue = widgetConfig && Array.isArray(widgetConfig.widgets) ? widgetConfig.widgets : [];

  return widgetsValue.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const widgetObj = item as Record<string, unknown>;
    if (typeof widgetObj.id !== 'string') return [];
    const widget: Widget = {
      id: widgetObj.id,
      type: typeof widgetObj.type === 'string' ? widgetObj.type : widgetObj.id,
      name: typeof widgetObj.name === 'string' ? widgetObj.name : widgetObj.id,
      description: typeof widgetObj.description === 'string' ? widgetObj.description : '',
      enabled: typeof widgetObj.enabled === 'boolean' ? widgetObj.enabled : false,
      settings: widgetObj.settings && typeof widgetObj.settings === 'object'
        ? (widgetObj.settings as Record<string, JsonValue>)
        : undefined,
    };
    return [widget];
  });
}

export default function WidgetsPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>(availableWidgets);
  const [loading, setLoading] = useState(true);

  const loadWidgets = useCallback(async () => {
    try {
      const data = await fetchAPI('/settings', { redirectOn401: false, cache: 'no-store' });
      const savedWidgets = extractSavedWidgets(data);
      if (savedWidgets.length > 0) {
        const savedMap = new Map(savedWidgets.map((saved) => [saved.id, saved]));
        setWidgets(availableWidgets.map((w) => ({ ...w, ...(savedMap.get(w.id) || {}) })));
      }
    } catch (e: unknown) {
      logger.error('Failed to load widgets', e, { component: 'WidgetsPage' });
      showError(getErrorMessage(e, 'Failed to load widgets'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  async function handleSave() {
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ widgetConfig: { widgets } }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success('Widget configuration saved successfully!');
    } catch (e: unknown) {
      logger.error('Failed to save widget configuration', e, { component: 'WidgetsPage' });
      showError(getErrorMessage(e, 'Failed to save widget configuration'));
    }
  }

  function toggleWidget(widgetId: string) {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  }

  function getWidgetIcon(type: string) {
    switch (type) {
      case 'latest-posts': return <FileText size={20} />;
      case 'trending-posts': return <TrendingUp size={20} />;
      case 'latest-comments': return <MessageSquare size={20} />;
      case 'category-archives': return <Folder size={20} />;
      case 'about-me': return <User size={20} />;
      case 'social-sharing': return <Share2 size={20} />;
      default: return <FileText size={20} />;
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6 px-1">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Widget Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage sidebar widgets for your site.</p>
          </div>
          <Button onClick={handleSave}>
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
      </div>

      <div className="grid gap-4">
        {widgets.map((widget) => (
          <Card key={widget.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    {getWidgetIcon(widget.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{widget.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{widget.description}</p>
                  </div>
                </div>
                <Switch
                  checked={widget.enabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

