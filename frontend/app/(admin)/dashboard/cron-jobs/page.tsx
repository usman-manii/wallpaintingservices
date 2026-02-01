// frontend/app/(admin)/dashboard/cron-jobs/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Tooltip, InfoTooltip } from '@/components/ui/Tooltip';
import { fetchAPI } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Database,
  Search,
  Bot,
  Share2,
  Calendar,
  Zap,
  RefreshCw,
  Activity,
  Link as LinkIcon
} from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  category: string;
  schedule: string;
  cronExpression: string;
  description: string;
  status: 'active' | 'planned' | 'disabled';
  lastRun: string | null;
  nextRun: string;
}

const categoryIcons: Record<string, any> = {
  BLOG: Calendar,
  SEO: Search,
  DATABASE: Database,
  AI: Bot,
  DISTRIBUTION: Share2,
};

const categoryColors: Record<string, string> = {
  BLOG: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  SEO: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  DATABASE: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  AI: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  DISTRIBUTION: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
};

export default function CronJobsPage() {
  const { success, error: showError } = useToast();
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [sitemapStats, setSitemapStats] = useState<any>(null);
  const [interlinkingStats, setInterlinkingStats] = useState<any>(null);
  const [triggering, setTriggering] = useState<string | null>(null);

  const fetchCronJobs = useCallback(async () => {
    try {
      const data = await fetchAPI('/tasks/cron-jobs', { redirectOn401: false, cache: 'no-store' });
      setCronJobs(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching cron jobs:', error);
      showError(error.message || 'Failed to fetch cron jobs');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchSitemapStats = useCallback(async () => {
    try {
      const data = await fetchAPI('/tasks/sitemap/stats', { redirectOn401: false, cache: 'no-store' });
      setSitemapStats(data || {});
    } catch (error: any) {
      console.error('Error fetching sitemap stats:', error);
    }
  }, []);

  const fetchInterlinkingStats = useCallback(async () => {
    try {
      const data = await fetchAPI('/blog/ai/interlink/stats', { redirectOn401: false, cache: 'no-store' });
      setInterlinkingStats(data || {});
    } catch (error: any) {
      console.error('Error fetching interlinking stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCronJobs();
    fetchSitemapStats();
    fetchInterlinkingStats();
  }, [fetchCronJobs, fetchSitemapStats, fetchInterlinkingStats]);

  const triggerJob = async (jobId: string) => {
    setTriggering(jobId);
    try {
      const endpoint = jobId.replace(/-/g, '-'); // scheduled-posts -> scheduled-posts
      await fetchAPI(`/tasks/trigger/${endpoint}`, { method: 'POST', redirectOn401: false, cache: 'no-store' });
      success('Job triggered successfully! Check server logs for results.');
      fetchCronJobs();
    } catch (error: any) {
      console.error('Error triggering job:', error);
      showError(error.message || 'Error triggering job');
    } finally {
      setTriggering(null);
    }
  };

  const generateSitemap = async () => {
    setTriggering('sitemap');
    try {
      const data = await fetchAPI('/tasks/sitemap/generate', { method: 'POST', redirectOn401: false, cache: 'no-store' });
      success(`Sitemap generated! ${data?.stats?.totalUrls || 0} URLs included.`);
      fetchSitemapStats();
    } catch (error: any) {
      console.error('Error generating sitemap:', error);
      showError(error.message || 'Error generating sitemap');
    } finally {
      setTriggering(null);
    }
  };

  const formatNextRun = (nextRun: string) => {
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `In ${diffMins} minutes`;
    if (diffHours < 24) return `In ${diffHours} hours`;
    return `In ${diffDays} days`;
  };

  const groupedJobs = cronJobs.reduce((acc, job) => {
    if (!acc[job.category]) acc[job.category] = [];
    acc[job.category].push(job);
    return acc;
  }, {} as Record<string, CronJob[]>);

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <LoadingSkeleton lines={2} />
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Cron Jobs Manager</h1>
        <p className="text-muted-foreground">
          Automated background tasks running on schedule
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Tooltip content="Total scheduled cron jobs in the system">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold text-foreground">{cronJobs.length}</p>
                </div>
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>

        <Tooltip content="Jobs currently running on schedule">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {cronJobs.filter(j => j.status === 'active').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>

        <Tooltip content="Jobs scheduled but not yet implemented">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planned</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {cronJobs.filter(j => j.status === 'planned').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>

        <Tooltip content="Number of job categories">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Object.keys(groupedJobs).length}
                  </p>
                </div>
                <Database className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>
      </div>

      {/* Sitemap Statistics */}
      {sitemapStats && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-green-600" />
              XML Sitemap Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total URLs</p>
                <p className="text-xl font-bold text-foreground">{sitemapStats.totalUrls}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Blog Posts</p>
                <p className="text-xl font-bold text-blue-600">{sitemapStats.blogPosts}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Categories</p>
                <p className="text-xl font-bold text-purple-600">{sitemapStats.categories}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tags</p>
                <p className="text-xl font-bold text-pink-600">{sitemapStats.tags}</p>
              </div>
              <div>
                <Tooltip content="Manually regenerate sitemap with latest content">
                  <Button 
                    onClick={generateSitemap}
                    disabled={triggering === 'sitemap'}
                    className="w-full"
                  >
                    {triggering === 'sitemap' ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Now
                      </>
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
              Base URL: {sitemapStats.baseUrl} | Last generated: {new Date(sitemapStats.lastGenerated).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cron Jobs by Category */}
      {/* Interlinking Stats Section */}
      {interlinkingStats && (
        <Card className="border-l-4 border-l-pink-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-pink-600" />
              Content Interlinking Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-500 mb-1">Total Links</div>
                <div className="text-2xl font-bold">{interlinkingStats.totalLinks}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-sm text-slate-500 mb-1">Pending Posts</div>
                <div className="text-2xl font-bold text-orange-600">{interlinkingStats.pendingPosts}</div>
                <div className="text-xs text-slate-400">Needs interlinking</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                 <div className="text-sm text-slate-500 mb-1">Avg Links/Post</div>
                 <div className="text-2xl font-bold">{interlinkingStats.avgLinksPerPost}</div>
              </div>
              <div className="flex items-center justify-center">
                 <Button 
                   onClick={() => triggerJob('auto-interlinking')}
                   isLoading={triggering === 'auto-interlinking'}
                   variant="outline"
                   className="w-full"
                 >
                   <Play className="w-4 h-4 mr-2" />
                   Run Interlinking
                 </Button>
              </div>
            </div>
            {!interlinkingStats.settings?.enabled && (
               <div className="mt-4 flex items-center text-amber-600 bg-amber-50 p-2 rounded text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Auto-interlinking is currently disabled in settings. 
               </div>
            )}
          </CardContent>
        </Card>
      )}

      {Object.entries(groupedJobs).map(([category, jobs]) => {
        const Icon = categoryIcons[category] || Clock;
        const colorClass = categoryColors[category] || 'bg-slate-100 dark:bg-slate-800';

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {category} Tasks
                <span className="ml-auto text-sm font-normal text-slate-500">
                  {jobs.length} job{jobs.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {job.name}
                          </h3>
                          <Badge 
                            variant={
                              job.status === 'active' ? 'success' : 
                              job.status === 'planned' ? 'warning' : 'default'
                            }
                            size="sm"
                          >
                            <Activity className="w-3 h-3 mr-1" />
                            {job.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.schedule}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Next run: {formatNextRun(job.nextRun)}
                          </span>
                          <span>Cron: {job.cronExpression}</span>
                        </div>
                      </div>
                      {job.status === 'active' && (
                        <Tooltip content="Run this job immediately">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerJob(job.id)}
                            disabled={triggering === job.id}
                            className="ml-4"
                          >
                            {triggering === job.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Running...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Trigger Now
                              </>
                            )}
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                About Cron Jobs
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Cron jobs are automated tasks that run on a schedule. <strong>Active</strong> jobs are currently running on schedule. 
                <strong> Planned</strong> jobs are configured but not yet implemented (placeholders for future features). 
                You can manually trigger active jobs using the "Trigger Now" button for testing or immediate execution.
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-400 mt-2">
                <strong>⚠️ Note:</strong> Manually triggering jobs does not affect their scheduled execution. 
                They will continue to run automatically at their designated times.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
