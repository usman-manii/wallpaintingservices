// frontend/app/(admin)/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Settings, LogOut, CheckCircle, RefreshCw, FileText } from 'lucide-react';

  export default function Dashboard() {
    const router = useRouter();
    const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDocs: 0, pending: 0, published: 0 });

  useEffect(() => {
    let mounted = true;
    
    async function checkAuth() {
      try {
        await fetchAPI('/auth/profile', { method: 'GET', cache: 'no-store', redirectOn401: false });
        if (mounted) {
          setIsAuthenticated(true);
          loadDrafts();
        }
      } catch {
        if (mounted) {
          router.push('/auth?next=' + encodeURIComponent('/dashboard'));
        }
      }
    }
    
    checkAuth();
    return () => { mounted = false; };
  }, []); // Empty deps - only run once on mount

  const loadDrafts = useCallback(async () => {
      try {
        const data = await fetchAPI('/blog?take=5', { redirectOn401: false, cache: 'no-store' });
        setPosts(data);
        // Mock stats for now, real app would have /stats endpoint
        setStats({ totalDocs: 142, pending: 3, published: data.length });
      } catch (e) {
          console.error("Failed to load posts", e);
      }
  }, []);

  async function handleGenerate() {
    if (!topic) return;
    setLoading(true);
    setMessage('');
    
    try {
      await fetchAPI('/queue/generate', {
          method: 'POST',
          body: JSON.stringify({ topic }),
          redirectOn401: false
      });

      setMessage(`✅ Job queued for "${topic}".`);
      setTopic('');
      setTimeout(() => {
          loadDrafts();
          setMessage('');
      }, 3000); 

    } catch (e: any) {
      if (e.message.includes('Unauthorized')) router.push('/auth');
      setMessage(`❌ Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Sign in required</h1>
        <p className="text-slate-600">Please sign in to view the dashboard.</p>
        <Button onClick={() => router.push('/auth')}>Go to Sign In</Button>
      </div>
    );
  }

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
                router.push('/auth');
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
                        <div className={`p-4 rounded-lg mb-6 ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Quick List Column */}
        <div>
             <Card className="h-full">
                <CardHeader>
                    <CardTitle>Recent Drafts</CardTitle>
                </CardHeader>
                <CardContent>
                    {posts.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No recent activity</div>
                    ) : (
                        <ul className="space-y-4">
                            {posts.map((post: any) => (
                                <li key={post.id} className="flex flex-col gap-1 pb-4 border-b last:border-0 border-slate-100">
                                    <span className="font-medium text-slate-800 line-clamp-1">{post.title}</span>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        <span className={`px-2 py-0.5 rounded-full ${post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {post.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:text-blue-700" onClick={() => window.open('/blog', '_blank')}>
                        View All Posts
                    </Button>
                </CardContent>
            </Card>
        </div>
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
