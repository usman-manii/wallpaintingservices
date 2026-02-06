'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Sparkles, Loader, CheckCircle, Clock, FileText, Zap, Settings as SettingsIcon } from 'lucide-react';
import AISettings from '@/components/admin/AISettings';
import { fetchAPI } from '@/lib/api';

interface GenerationJob {
  id: string;
  topic: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  result?: unknown;
}

export default function AIContentPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'settings'>('generate');

  const fetchJobs = useCallback(async () => {
    try {
      const data = await fetchAPI('/queue/jobs', { redirectOn401: false, cache: 'no-store' });
      setJobs(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      logger.error('Error fetching jobs', error, { component: 'AIContentPage' });
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'generate') {
      fetchJobs();
    }
  }, [activeTab, fetchJobs]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    setLoading(true);
    setMessage('');
    setMessageTone(null);

    try {
      await fetchAPI('/queue/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          keywords,
          tone,
          length,
        }),
        redirectOn401: false,
        cache: 'no-store',
      });
      setMessage('Content generation started. Check the queue below.');
      setMessageTone('success');
      setTopic('');
      setKeywords('');
      setTimeout(() => fetchJobs(), 2000);
    } catch (error: unknown) {
      logger.error('Error generating content', error, { component: 'AIContentPage' });
      setMessage('Failed to start generation. Please try again.');
      setMessageTone('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'PROCESSING':
        return <Loader size={16} className="text-blue-600 animate-spin" />;
      case 'FAILED':
        return <FileText size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-purple-600" />
            AI Content Generation
          </h1>
          <p className="text-slate-600 mt-2">
            Generate SEO-optimized blog posts using AI and configure models.
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('generate')}
          className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
            activeTab === 'generate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Generator
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-1 font-medium text-sm transition-colors relative ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Configuration
        </button>
      </div>

      {activeTab === 'settings' ? (
        <AISettings />
      ) : (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-blue-600" size={20} />
              <span className="text-2xl font-bold">{jobs.filter(j => j.status === 'PROCESSING').length}</span>
            </div>
            <p className="text-sm text-slate-600">Active Generations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-2xl font-bold">{jobs.filter(j => j.status === 'COMPLETED').length}</span>
            </div>
            <p className="text-sm text-slate-600">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-slate-600" size={20} />
              <span className="text-2xl font-bold">{jobs.filter(j => j.status === 'PENDING').length}</span>
            </div>
            <p className="text-sm text-slate-600">In Queue</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate New Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Topic / Title *
              </label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Best Color Schemes for Living Rooms"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SEO Keywords (comma-separated)
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="painting, interior design, color theory"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="short">Short (500-800 words)</option>
                  <option value="medium">Medium (800-1500 words)</option>
                  <option value="long">Long (1500-2500 words)</option>
                </select>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${messageTone === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No generation jobs yet. Create your first AI-generated content above!
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(job.status)}
                    <div>
                      <h4 className="font-medium text-slate-900">{job.topic}</h4>
                      <p className="text-xs text-slate-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </>)}
    </div>
  );
}

