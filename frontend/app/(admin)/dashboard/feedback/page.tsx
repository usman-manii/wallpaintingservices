'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { fetchAPI } from '@/lib/api';
import {
  TrendingUp,
  Search,
  MessageSquare,
  Mail,
  Link as LinkIcon,
  Bot,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  BarChart3,
} from 'lucide-react';

interface FeedbackOverview {
  seo: any;
  aiContent: any;
  interlinking: any;
  comments: any;
  contact: {
    totalMessages: number;
    latestMessages: any[];
  };
}

export default function FeedbackPage() {
  const router = useRouter();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<FeedbackOverview | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postFeedback, setPostFeedback] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/feedback/overview');
      setOverview(data);
    } catch (error: any) {
      console.error('Error fetching feedback overview:', error);
      showError(error.message || 'Failed to load feedback overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostFeedback = async (postId: string) => {
    try {
      setLoadingPost(true);
      setSelectedPostId(postId);
      const data = await fetchAPI(`/feedback/posts/${postId}`);
      setPostFeedback(data);
    } catch (error: any) {
      console.error('Error fetching post feedback:', error);
      showError(error.message || 'Failed to load post feedback');
      setPostFeedback(null);
    } finally {
      setLoadingPost(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  };

  const formatMetric = (value: any, decimals = 1, fallback = '0.0') => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : fallback;
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-6">
        <EmptyState
          title="No Feedback Data"
          description="Unable to load feedback overview. Please try again later."
          action={{
            label: 'Retry',
            onClick: fetchOverview,
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Feedback Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Unified AI-enabled feedback engine for SEO, content, comments, and engagement
          </p>
        </div>
        <Button onClick={fetchOverview} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SEO Score */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">SEO Score</CardTitle>
              <Search className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getScoreColor(overview.seo?.overallScore || 0)}`}>
                {overview.seo?.overallScore || 0}
              </span>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
            <Badge className={`mt-2 ${getScoreBadge(overview.seo?.overallScore || 0)}`}>
              {overview.seo?.overallScore >= 80 ? 'Excellent' : overview.seo?.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        {/* AI Content Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">AI Content</CardTitle>
              <Bot className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Generated Posts</span>
                <span className="font-semibold">{overview.aiContent?.totalGenerated || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Auto-Tagged</span>
                <span className="font-semibold">{overview.aiContent?.autoTagged || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Comments</CardTitle>
              <MessageSquare className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
                <span className="font-semibold">{overview.comments?.total || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
                <span className="font-semibold text-yellow-600">{overview.comments?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Approved</span>
                <span className="font-semibold text-green-600">{overview.comments?.approved || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Contact</CardTitle>
              <Mail className="w-5 h-5 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{overview.contact?.totalMessages || 0}</span>
              <span className="text-sm text-slate-500">messages</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Audit Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              SEO Audit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.seo?.issues && overview.seo.issues.length > 0 ? (
              <div className="space-y-2">
                {overview.seo.issues.slice(0, 5).map((issue: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                    {issue.severity === 'high' ? (
                      <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : issue.severity === 'medium' ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{issue.title}</p>
                      {issue.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{issue.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No SEO issues found</p>
            )}
          </CardContent>
        </Card>

        {/* Interlinking Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Interlinking Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Internal Links</span>
                <span className="font-semibold">{overview.interlinking?.totalLinks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Linked Posts</span>
                <span className="font-semibold">{overview.interlinking?.linkedPosts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Average Links per Post</span>
                <span className="font-semibold">{formatMetric(overview.interlinking?.avgLinksPerPost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post-Level Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Post-Level Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter post ID to analyze..."
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    fetchPostFeedback(e.currentTarget.value);
                  }
                }}
              />
              <Button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="post ID"]') as HTMLInputElement;
                  if (input?.value) fetchPostFeedback(input.value);
                }}
                disabled={loadingPost}
              >
                {loadingPost ? <LoadingSpinner size="sm" /> : 'Analyze'}
              </Button>
            </div>

            {postFeedback && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{postFeedback.post?.title}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge>{postFeedback.post?.status}</Badge>
                    <Badge variant="info">
                      <Eye className="w-3 h-3 mr-1" />
                      {postFeedback.post?.viewCount || 0} views
                    </Badge>
                    <Badge variant="warning">
                      <Clock className="w-3 h-3 mr-1" />
                      {postFeedback.post?.readingTime || 0} min read
                    </Badge>
                  </div>
                </div>

                {postFeedback.seo && (
                  <div>
                    <h4 className="font-medium mb-2">SEO Score: {postFeedback.seo.overallScore || 0}/100</h4>
                    {postFeedback.seo.issues && postFeedback.seo.issues.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {postFeedback.seo.issues.slice(0, 3).map((issue: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span>{issue.title}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {postFeedback.comments && postFeedback.comments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Comments ({postFeedback.comments.length})</h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {postFeedback.comments.length} approved comment(s)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
