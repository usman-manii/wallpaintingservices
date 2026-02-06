'use client';

import logger from '@/lib/logger';

import { useEffect, useMemo, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, FileText, Calendar, User, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/lib/error-utils';

interface DraftPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  author?: { username?: string; displayName?: string; email?: string };
  _count?: { comments?: number };
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseDraftPost = (value: unknown): DraftPost | null => {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id : '';
  if (!id) return null;
  return {
    id,
    title: typeof value.title === 'string' ? value.title : 'Untitled Draft',
    slug: typeof value.slug === 'string' ? value.slug : '',
    status: typeof value.status === 'string' ? value.status : 'DRAFT',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    author: isRecord(value.author)
      ? {
          username: typeof value.author.username === 'string' ? value.author.username : undefined,
          displayName: typeof value.author.displayName === 'string' ? value.author.displayName : undefined,
          email: typeof value.author.email === 'string' ? value.author.email : undefined,
        }
      : undefined,
    _count: isRecord(value._count)
      ? {
          comments: typeof value._count.comments === 'number' ? value._count.comments : undefined,
        }
      : undefined,
  };
};

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/blog/admin/posts?status=DRAFT&take=200', { redirectOn401: false, cache: 'no-store' });
      const list = Array.isArray(data) ? data : [];
      setDrafts(list.map(parseDraftPost).filter((post): post is DraftPost => !!post));
      setError(null);
    } catch (err) {
      logger.error('Failed to load drafts', err, { component: 'DraftsPage' });
      setError(getErrorMessage(err, 'Failed to load drafts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const filteredDrafts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return drafts;
    return drafts.filter((draft) =>
      draft.title.toLowerCase().includes(term) || draft.slug.toLowerCase().includes(term)
    );
  }, [drafts, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Drafts</h1>
          <p className="text-slate-600">Review and publish your draft pipeline.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDrafts}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => router.push('/dashboard/posts/new')}>
            <FileText className="w-4 h-4 mr-2" /> New Draft
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drafts by title or slug"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-red-600">{error}</CardContent>
        </Card>
      ) : filteredDrafts.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-500">
            No drafts found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Draft Queue ({filteredDrafts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {filteredDrafts.map((draft) => (
                <div key={draft.id} className="flex flex-col gap-3 px-6 py-4 hover:bg-slate-50">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{draft.title}</h3>
                      <p className="text-sm text-slate-500">/{draft.slug}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/posts/edit/${draft.id}`)}>
                        Edit Draft
                      </Button>
                      <Button size="sm" onClick={() => router.push(`/dashboard/posts/edit/${draft.id}?publish=1`)}>
                        Publish
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(draft.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {draft.author?.displayName || draft.author?.username || draft.author?.email || 'Unknown'}</span>
                    <span className="text-slate-400">Comments: {draft._count?.comments ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
