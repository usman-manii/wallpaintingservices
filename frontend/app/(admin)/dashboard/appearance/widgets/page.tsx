'use client';

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Save, ArrowLeft, FileText, TrendingUp, MessageSquare, Folder, User, Share2 } from 'lucide-react';

interface Widget {
  id: string;
  type: string;
  name: string;
  description: string;
  enabled: boolean;
  settings?: any;
}

const availableWidgets: Widget[] = [
  { id: 'latest-posts', type: 'latest-posts', name: 'Latest Posts', description: 'Display the most recent blog posts', enabled: false },
  { id: 'trending-posts', type: 'trending-posts', name: 'Trending Posts', description: 'Show popular or trending posts', enabled: false },
  { id: 'latest-comments', type: 'latest-comments', name: 'Latest Comments', description: 'Display recent comments from readers', enabled: false },
  { id: 'category-archives', type: 'category-archives', name: 'Category Archives', description: 'List all post categories', enabled: false },
  { id: 'about-me', type: 'about-me', name: 'About Me', description: 'Show author or site owner information', enabled: false },
  { id: 'social-sharing', type: 'social-sharing', name: 'Social Sharing', description: 'Social media sharing buttons', enabled: false },
];

export default function WidgetsPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [widgets, setWidgets] = useState<Widget[]>(availableWidgets);
  const [loading, setLoading] = useState(true);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<any>({});

  useEffect(() => {
    loadWidgets();
  }, []);

  async function loadWidgets() {
    try {
      const data = await fetchAPI('/settings');
      if (data?.widgetConfig?.widgets) {
        const savedWidgets = data.widgetConfig.widgets;
        setWidgets(availableWidgets.map(w => {
          const saved = savedWidgets.find((sw: any) => sw.id === w.id);
          return saved ? { ...w, ...saved } : w;
        }));
      }
    } catch (e: any) {
      showError(e.message || 'Failed to load widgets');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ widgetConfig: { widgets } })
      });
      success('Widget configuration saved successfully!');
    } catch (e: any) {
      showError(e.message || 'Failed to save widget configuration');
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
