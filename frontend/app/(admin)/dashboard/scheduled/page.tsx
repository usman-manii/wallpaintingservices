'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { fetchAPI } from '@/lib/api';

type ScheduledPost = {
  id: string;
  title: string;
  slug: string;
  scheduledFor: string;
  status: string;
  author: { username: string; displayName: string };
  categories: { name: string }[];
  tags: { name: string }[];
};

export default function ScheduledPostsPage() {
  const { success, error: showError } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingScheduled, setProcessingScheduled] = useState(false);

  const fetchScheduledPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/blog/admin/scheduled', { redirectOn401: false, cache: 'no-store' });
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledPosts();
  }, [fetchScheduledPosts]);

  const handleProcessScheduled = async () => {
    setProcessingScheduled(true);
    try {
      const result = await fetchAPI('/blog/admin/process-scheduled', {
        method: 'POST',
        redirectOn401: false,
        cache: 'no-store',
      }).catch(() => null);
      success(`${(result as any) || 0} posts published!`);
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
      showError('Failed to process scheduled posts');
    } finally {
      setProcessingScheduled(false);
    }
  };

  const groupPostsByDate = () => {
    const grouped: { [date: string]: ScheduledPost[] } = {};
    posts.forEach(post => {
      const date = new Date(post.scheduledFor).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(post);
    });
    return grouped;
  };

  const groupedPosts = groupPostsByDate();
  const sortedDates = Object.keys(groupedPosts).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Scheduled Posts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage posts scheduled for future publication
          </p>
        </div>
        <Button onClick={handleProcessScheduled} disabled={processingScheduled}>
          {processingScheduled ? 'Publishing...' : '🚀 Publish Due Posts Now'}
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{posts.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {posts.filter(p => new Date(p.scheduledFor) <= new Date()).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Ready to Publish</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                {posts.filter(p => new Date(p.scheduledFor) > new Date()).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Future Scheduled</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-600 dark:text-slate-400">
            Loading scheduled posts...
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-600 dark:text-slate-400">
            No scheduled posts found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                    {groupedPosts[date].length} post{groupedPosts[date].length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedPosts[date]
                    .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
                    .map(post => (
                      <div 
                        key={post.id}
                        className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {/* Time */}
                        <div className="text-center min-w-[80px]">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {new Date(post.scheduledFor).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          {new Date(post.scheduledFor) <= new Date() && (
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                              Ready
                            </div>
                          )}
                        </div>

                        {/* Post Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
                            {post.title}
                          </h3>
                          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            by {post.author.displayName || post.author.username}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {post.categories.map((cat, idx) => (
                              <span 
                                key={idx}
                                className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 px-2 py-1 rounded"
                              >
                                {cat.name}
                              </span>
                            ))}
                            {post.tags.slice(0, 3).map((tag, idx) => (
                              <span 
                                key={idx}
                                className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                +{post.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(`/dashboard/posts/${post.id}/edit`, '_blank')}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="mb-2">
              <strong>⏰ Automatic Publishing:</strong> Posts are automatically published every 5 minutes by the backend cron job.
            </p>
            <p className="mb-2">
              <strong>🚀 Manual Publishing:</strong> Click "Publish Due Posts Now" to immediately publish all posts scheduled for the past.
            </p>
            <p>
              <strong>✏️ Edit Scheduling:</strong> To change the scheduled time, click "Edit" on any post and update the "Schedule Publishing" field.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
