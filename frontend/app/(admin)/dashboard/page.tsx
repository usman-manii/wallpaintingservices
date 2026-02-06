// frontend/app/(admin)/dashboard/page.tsx
'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Settings, LogOut, CheckCircle, RefreshCw, FileText, Search, MessageSquare, Mail, Link as LinkIcon, AlertCircle, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';

type DashboardPost = {
  id: string;
  title?: string;
  createdAt?: string;
  status?: string;
};

type SeoIssue = {
  title?: string;
  description?: string;
  severity?: 'high' | 'medium' | 'low';
};

type FeedbackOverview = {
  seo?: {
    overallScore?: number;
    issues?: SeoIssue[];
  };
  aiContent?: {
    totalGenerated?: number;
    autoTagged?: number;
  };
  interlinking?: {
    totalLinks?: number;
    linkedPosts?: number;
    avgLinksPerPost?: number;
  };
  comments?: {
    total?: number;
    pending?: number;
    approved?: number;
  };
  contact?: {
    totalMessages?: number;
    latestMessages?: Array<{ id?: string; email?: string; subject?: string }>;
  };
};

type DashboardStats = {
  totalDocs: number;
  pending: number;
  published: number;
  drafts?: number;
  scheduled?: number;
  users?: number;
  pages?: number;
  pendingComments?: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseFeedbackOverview = (value: unknown): FeedbackOverview | null => {
  if (!isRecord(value)) return null;
  const seoRaw = isRecord(value.seo) ? value.seo : null;
  const issues = Array.isArray(seoRaw?.issues)
    ? seoRaw?.issues
        .map((issue) => {
          if (!isRecord(issue)) return null;
          return {
            title: typeof issue.title === 'string' ? issue.title : undefined,
            description: typeof issue.description === 'string' ? issue.description : undefined,
            severity: issue.severity === 'high' || issue.severity === 'medium' || issue.severity === 'low' ? issue.severity : undefined,
          } as SeoIssue;
        })
        .filter((issue): issue is SeoIssue => !!issue)
    : undefined;

  const contactRaw = isRecord(value.contact) ? value.contact : null;
  const latestMessages = Array.isArray(contactRaw?.latestMessages)
    ? contactRaw?.latestMessages
        .map((msg) => {
          if (!isRecord(msg)) return null;
          return {
            id: typeof msg.id === 'string' ? msg.id : undefined,
            email: typeof msg.email === 'string' ? msg.email : undefined,
            subject: typeof msg.subject === 'string' ? msg.subject : undefined,
          };
        })
        .filter((msg): msg is { id: string | undefined; email: string | undefined; subject: string | undefined } => !!msg)
    : undefined;

  return {
    seo: seoRaw
      ? {
          overallScore: typeof seoRaw.overallScore === 'number' ? seoRaw.overallScore : undefined,
          issues,
        }
      : undefined,
    aiContent: isRecord(value.aiContent)
      ? {
          totalGenerated: typeof value.aiContent.totalGenerated === 'number' ? value.aiContent.totalGenerated : undefined,
          autoTagged: typeof value.aiContent.autoTagged === 'number' ? value.aiContent.autoTagged : undefined,
        }
      : undefined,
    interlinking: isRecord(value.interlinking)
      ? {
          totalLinks: typeof value.interlinking.totalLinks === 'number' ? value.interlinking.totalLinks : undefined,
          linkedPosts: typeof value.interlinking.linkedPosts === 'number' ? value.interlinking.linkedPosts : undefined,
          avgLinksPerPost: typeof value.interlinking.avgLinksPerPost === 'number' ? value.interlinking.avgLinksPerPost : undefined,
        }
      : undefined,
    comments: isRecord(value.comments)
      ? {
          total: typeof value.comments.total === 'number' ? value.comments.total : undefined,
          pending: typeof value.comments.pending === 'number' ? value.comments.pending : undefined,
          approved: typeof value.comments.approved === 'number' ? value.comments.approved : undefined,
        }
      : undefined,
    contact: contactRaw
      ? {
          totalMessages: typeof contactRaw.totalMessages === 'number' ? contactRaw.totalMessages : undefined,
          latestMessages,
        }
      : undefined,
  };
};

const parseDashboardStats = (value: unknown): DashboardStats | null => {
  if (!isRecord(value)) return null;
  return {
    totalDocs: typeof value.totalDocs === 'number' ? value.totalDocs : 0,
    pending: typeof value.pending === 'number' ? value.pending : 0,
    published: typeof value.published === 'number' ? value.published : 0,
    drafts: typeof value.drafts === 'number' ? value.drafts : undefined,
    scheduled: typeof value.scheduled === 'number' ? value.scheduled : undefined,
    users: typeof value.users === 'number' ? value.users : undefined,
    pages: typeof value.pages === 'number' ? value.pages : undefined,
    pendingComments: typeof value.pendingComments === 'number' ? value.pendingComments : undefined,
  };
};

function parseDashboardPost(value: unknown): DashboardPost | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string') return null;
  return {
    id: obj.id,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
  };
}

  export default function Dashboard() {
    const router = useRouter();
    const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalDocs: 0, pending: 0, published: 0 });
  const [feedback, setFeedback] = useState<FeedbackOverview | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function checkAuth() {
      try {
        await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: false });
        if (mounted) {
          setIsAuthenticated(true);
          loadDrafts();
          loadStats();
          loadFeedback();
        }
      } catch {
        if (mounted) {
          router.push('/login?next=' + encodeURIComponent('/dashboard'));
        }
      }
    }
    
    checkAuth();
    return () => { mounted = false; };
  }, []); // Empty deps - only run once on mount

  const loadDrafts = useCallback(async () => {
      try {
        const data = await fetchAPI('/blog?take=5', { redirectOn401: false, cache: 'no-store' });
        const list = Array.isArray(data) ? data : [];
        setPosts(list.map(parseDashboardPost).filter((post): post is DashboardPost => post !== null));
      } catch (e: unknown) {
          logger.error('Failed to load posts', e, { component: 'Dashboard' });
      }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchAPI('/dashboard/stats', { redirectOn401: false, cache: 'no-store' });
      const parsed = parseDashboardStats(data);
      if (parsed) {
        setStats(parsed);
      }
    } catch (e: unknown) {
      logger.error('Failed to load dashboard stats', e, { component: 'Dashboard' });
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    try {
      setFeedbackLoading(true);
      setFeedbackError(null);
      const data = await fetchAPI('/feedback/overview', { redirectOn401: false, cache: 'no-store' });
      const parsed = parseFeedbackOverview(data);
      setFeedback(parsed);
    } catch (e: unknown) {
      const message = getErrorMessage(e, 'Failed to load feedback overview');
      setFeedbackError(message);
      setFeedback(null);
      logger.error('Failed to load feedback overview', e, { component: 'Dashboard' });
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  async function handleGenerate() {
    if (!topic) return;
    setLoading(true);
    setMessage('');
    setMessageTone(null);
    
    try {
      await fetchAPI('/queue/generate', {
          method: 'POST',
          body: JSON.stringify({ topic }),
          redirectOn401: false
      });

      setMessage(`Job queued for "${topic}".`);
      setMessageTone('success');
      setTopic('');
      setTimeout(() => {
          loadDrafts();
          loadStats();
          setMessage('');
          setMessageTone(null);
      }, 3000); 

    } catch (e: unknown) {
      const errorMessage = getErrorMessage(e, 'Error starting job');
      if (errorMessage.includes('Unauthorized')) router.push('/login');
      setMessage(`Error: ${errorMessage}`);
      setMessageTone('error');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Sign in required</h1>
        <p className="text-slate-600">Please sign in to view the dashboard.</p>
        <Button onClick={() => router.push('/login')}>Go to Sign In</Button>
      </div>
    );
  }

  const seoScore = feedback?.seo?.overallScore ?? 0;
  const scoreColor = seoScore >= 80 ? 'text-green-600' : seoScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
           <p className="text-slate-500">Manage your AI content pipeline</p>
        </div>
        <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard/settings')}>
                <Settings size={16} className="mr-2" /> Settings
            </Button>
            <Button
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                localStorage.removeItem('user_role');
                router.push('/login');
              }}
            >
                <LogOut size={16} className="mr-2" /> Logout
            </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Articles" value={stats.totalDocs} icon={<FileText className="text-blue-500" />} />
        <StatCard title="Published" value={stats.published} icon={<CheckCircle className="text-green-500" />} />
        <StatCard title="Queue Processing" value={stats.pending} icon={<RefreshCw className="text-orange-500 animate-spin-slow" />} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator Column */}
        <div className="lg:col-span-2">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>AI Content Generator</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 mb-6">
                        <label className="block text-sm font-medium mb-2 text-slate-700">New Article Topic</label>
                        <div className="flex gap-3">
                            <Input 
                                placeholder="e.g. 'The Future of Quantum Computing'" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleGenerate} isLoading={loading}>
                                <Plus size={16} className="mr-2" /> Generate
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            This triggers a background job. The Worker extracts keywords, generates text, and creates a draft.
                        </p>
                    </div>
                    {message && (
                        <div className={`p-4 rounded-lg mb-6 ${messageTone === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Drafts Summary Column */}
        <div>
             <Card className="h-full">
                <CardHeader>
                    <CardTitle>Draft Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div>
                            <div className="text-sm text-slate-500">Total Drafts</div>
                            <div className="text-3xl font-bold text-slate-900">{stats.drafts ?? 0}</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {stats.scheduled ? `${stats.scheduled} scheduled` : 'No scheduled drafts'}
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                        {posts.slice(0, 3).map((post) => (
                          <div key={post.id} className="flex items-center justify-between">
                            <span className="line-clamp-1">{post.title || 'Untitled draft'}</span>
                            <span className="text-xs text-slate-400">
                              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        ))}
                        {posts.length === 0 && (
                          <div className="text-slate-400">No drafts yet.</div>
                        )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/dashboard/drafts')}
                    >
                      View drafts
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Feedback & Insights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Feedback & Insights</h2>
            <p className="text-slate-500">SEO, comments, interlinking, and content performance in one place.</p>
          </div>
          <Button variant="outline" onClick={loadFeedback} disabled={feedbackLoading}>
            <RefreshCw size={16} className={`mr-2 ${feedbackLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {feedbackLoading ? (
          <Card>
            <CardContent className="p-6 text-slate-500">Loading feedback overview...</CardContent>
          </Card>
        ) : feedback ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">SEO Score</CardTitle>
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${scoreColor}`}>{seoScore}</div>
                  <div className="text-xs text-slate-500">/ 100</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">AI Content</CardTitle>
                    <BarChart3 className="w-5 h-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Generated</span>
                    <span className="font-semibold">{feedback.aiContent?.totalGenerated || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Auto-tagged</span>
                    <span className="font-semibold">{feedback.aiContent?.autoTagged || 0}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Comments</CardTitle>
                    <MessageSquare className="w-5 h-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold">{feedback.comments?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending</span>
                    <span className="font-semibold text-yellow-600">{feedback.comments?.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Approved</span>
                    <span className="font-semibold text-green-600">{feedback.comments?.approved || 0}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">Interlinking</CardTitle>
                    <LinkIcon className="w-5 h-5 text-slate-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total links</span>
                    <span className="font-semibold">{feedback.interlinking?.totalLinks || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Linked posts</span>
                    <span className="font-semibold">{feedback.interlinking?.linkedPosts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg per post</span>
                    <span className="font-semibold">{(feedback.interlinking?.avgLinksPerPost ?? 0).toFixed(1)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SEO Issues Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {feedback.seo?.issues && feedback.seo.issues.length > 0 ? (
                    feedback.seo.issues.slice(0, 4).map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-slate-50">
                        {issue.severity === 'high' ? (
                          <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                        ) : issue.severity === 'medium' ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        )}
                        <div>
                          <div className="font-medium text-slate-800">{issue.title || 'SEO issue'}</div>
                          {issue.description && (
                            <div className="text-xs text-slate-500">{issue.description}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">No SEO issues detected.</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Latest Contact Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {feedback.contact?.latestMessages && feedback.contact.latestMessages.length > 0 ? (
                    feedback.contact.latestMessages.slice(0, 4).map((msg, idx) => (
                      <div key={msg.id || idx} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="font-medium text-slate-800">{msg.email || 'Unknown sender'}</div>
                          <div className="text-xs text-slate-500">{msg.subject || 'No subject'}</div>
                        </div>
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">No recent contact messages.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-slate-500">
              {feedbackError || 'Feedback data is not available yet.'}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-6">
                <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                    <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
                </div>
                <div className="p-3 bg-slate-50 rounded-full">
                    {icon}
                </div>
            </CardContent>
        </Card>
    )
}


