'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CalendarClock } from 'lucide-react';
import { API_URL } from '@/lib/api';
import logger from '@/lib/logger';

type UpcomingPost = {
  title?: string;
  scheduledFor?: string;
};

export default function UpcomingPostsWidget() {
    const [upcoming, setUpcoming] = useState<UpcomingPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchScheduled() {
            try {
                const res = await fetch(`${API_URL}/blog/admin/scheduled`, {
                    credentials: 'include'
                });
                
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data)
                      ? data
                      : (data && typeof data === 'object' && Array.isArray((data as { posts?: unknown }).posts) ? (data as { posts: unknown[] }).posts : []);
                    setUpcoming(list as UpcomingPost[]);
                }
            } catch (e: unknown) {
                logger.error('Failed to fetch upcoming posts', e, { component: 'UpcomingPostsWidget' });
            } finally {
                setLoading(false);
            }
        }
        fetchScheduled();
    }, []);

  if (!loading && upcoming.length === 0) return null;

  return (
    <Card className="mb-6 bg-slate-50 dark:bg-slate-900/50">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <CalendarClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <CardTitle className="text-lg">Scheduled Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="text-sm text-slate-500 animate-pulse">Loading schedule...</div>
        ) : (
            <ul className="space-y-3">
            {upcoming.slice(0, 5).map((post, idx) => (
              <li key={idx} className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 last:border-0 pb-2 last:pb-0">
                <p className="font-medium text-slate-700 dark:text-slate-200 text-sm truncate pr-2 max-w-[200px]">{post.title || ''}</p>
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {post.scheduledFor ? new Date(post.scheduledFor).toLocaleDateString() : 'Pending'}
                </span>
              </li>
            ))}
            </ul>
        )}
      </CardContent>
    </Card>
  );
}
