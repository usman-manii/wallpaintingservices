'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { Trash2, Eye, Edit, Plus, Calendar, User, FileText, Clock, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-utils';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  commentCount?: number;
  author: {
    id: string;
    name: string;
    username: string;
    displayName: string;
  };
  categories?: { name: string }[];
  tags?: { name: string }[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const parseNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const parseNameList = (value: unknown): { name: string }[] => (
  Array.isArray(value)
    ? value
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }
          const name = parseString(item.name);
          return name ? { name } : null;
        })
        .filter((item): item is { name: string } => !!item)
    : []
);

const parsePost = (value: unknown): Post | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  const title = parseString(value.title);
  const slug = parseString(value.slug);
  const excerpt = parseString(value.excerpt);
  const status = parseString(value.status);
  const createdAt = parseString(value.createdAt);
  if (!id || !title || !slug || !status || !createdAt) {
    return null;
  }
  const authorRaw = isRecord(value.author) ? value.author : null;
  const authorId = authorRaw ? parseString(authorRaw.id) : '';
  if (!authorId) {
    return null;
  }
  const author = {
    id: authorId,
    name: parseString(authorRaw?.name),
    username: parseString(authorRaw?.username),
    displayName: parseString(authorRaw?.displayName),
  };
  const countRaw = isRecord(value._count) ? value._count : null;
  const commentCount = countRaw ? parseNumber(countRaw.comments) : parseNumber(value.commentCount);
  return {
    id,
    title,
    slug,
    excerpt,
    status,
    scheduledFor: parseString(value.scheduledFor) || undefined,
    publishedAt: parseString(value.publishedAt) || undefined,
    createdAt,
    commentCount: commentCount || undefined,
    author,
    categories: parseNameList(value.categories),
    tags: parseNameList(value.tags),
  };
};

const parsePostsList = (value: unknown): Post[] => (
  Array.isArray(value) ? value.map(parsePost).filter((post): post is Post => !!post) : []
);

type FilterStatus = 'all' | 'PUBLISHED' | 'DRAFT' | 'SCHEDULED';
type SortOrder = 'latest' | 'oldest';

export default function PostsPage() {
  const router = useRouter();
  const { success, warning, error: showError } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [posts, setPosts] = useState<Post[]>([]); // full list from backend
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [authors, setAuthors] = useState<Array<{ id: string; name: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Always load the full admin post list once; filters are applied client-side
      const params = new URLSearchParams();
      params.append('take', '1000');

      const data = await fetchAPI(`/blog/admin/posts?${params.toString()}&_=${Date.now()}`, { redirectOn401: false, cache: 'no-store' });

      let rawList: unknown = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (isRecord(data)) {
        rawList = data.items ?? data.posts ?? [];
      }

      const list = parsePostsList(rawList);
      setPosts(list);

      if (list.length > 0) {
        const uniqueAuthors = Array.from(
          new Map(list.map((post) => [post.author.id, {
            id: post.author.id,
            name: post.author.displayName || post.author.username || post.author.name
          }])).values()
        );
        setAuthors(uniqueAuthors);
      } else {
        setAuthors([]);
      }
    } catch (error: unknown) {
      logger.error('Error fetching posts:', error);
      showError(getErrorMessage(error, 'Failed to fetch posts'));
      setPosts([]);
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // NOTE: We no longer refetch on filter changes; filters are applied client-side
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterAuthor, sortOrder, pageSize, posts.length]);

  const handleDelete = async (id: string, title: string) => {
    confirm(
      'Delete Post',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      async () => {
        try {
          await fetchAPI(`/blog/${id}`, {
            method: 'DELETE',
            redirectOn401: false,
            cache: 'no-store',
          });
          success('Post deleted successfully');
          fetchPosts();
        } catch (error: unknown) {
          logger.error('Error deleting post:', error);
          showError(getErrorMessage(error, 'Failed to delete post'));
        }
      },
      'danger'
    );
  };

  const getStatusBadge = (post: Post) => {
    if (post.status === 'SCHEDULED' || (post.scheduledFor && new Date(post.scheduledFor) > new Date())) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock size={12} />
          Scheduled
        </Badge>
      );
    }
    if (post.status === 'PUBLISHED' || post.publishedAt) {
      return <Badge variant="success">Published</Badge>;
    }
    return <Badge variant="default">Draft</Badge>;
  };

  const getStatusDate = (post: Post) => {
    if (post.scheduledFor && new Date(post.scheduledFor) > new Date()) {
      return `Scheduled for: ${new Date(post.scheduledFor).toLocaleString()}`;
    }
    if (post.publishedAt) {
      return `Published: ${new Date(post.publishedAt).toLocaleDateString()}`;
    }
    return `Created: ${new Date(post.createdAt).toLocaleDateString()}`;
  };

  // Calculate status counts from the full posts list (ensure posts is an array)
  const postsArray = Array.isArray(posts) ? posts : [];
  const statusCounts: Record<FilterStatus, number> = {
    all: postsArray.length,
    PUBLISHED: postsArray.filter(
      (p) => p.status === 'PUBLISHED' || !!p.publishedAt,
    ).length,
    DRAFT: postsArray.filter((p) => p.status === 'DRAFT').length,
    SCHEDULED: postsArray.filter(
      (p) =>
        p.status === 'SCHEDULED' ||
        (p.scheduledFor && new Date(p.scheduledFor) > new Date()),
    ).length,
  };

  // Apply filters client-side for a consistent UX
  let filteredPosts = postsArray;
  if (filterStatus === 'PUBLISHED') {
    filteredPosts = filteredPosts.filter(
      (p) => p.status === 'PUBLISHED' || !!p.publishedAt,
    );
  } else if (filterStatus === 'DRAFT') {
    filteredPosts = filteredPosts.filter((p) => p.status === 'DRAFT');
  } else if (filterStatus === 'SCHEDULED') {
    filteredPosts = filteredPosts.filter(
      (p) =>
        p.status === 'SCHEDULED' ||
        (p.scheduledFor && new Date(p.scheduledFor) > new Date()),
    );
  }

  if (filterAuthor !== 'all') {
    filteredPosts = filteredPosts.filter(
      (p) => p.author?.id === filterAuthor,
    );
  }

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return sortOrder === 'oldest' ? aDate - bDate : bDate - aDate;
  });
  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, sortedPosts.length);
  const paginatedPosts = sortedPosts.slice(pageStart, pageEnd);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Posts</h1>
        </div>
        <LoadingSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {dialog}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Posts
            <Badge variant="info">{postsArray.length}</Badge>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Create, edit, and manage your blog content</p>
        </div>
        <Tooltip content="Create a new blog post with AI assistance">
          <Link href="/dashboard/posts/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Post
            </Button>
          </Link>
        </Tooltip>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 space-y-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
            Filter by Status
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'PUBLISHED', 'DRAFT', 'SCHEDULED'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                <span className="ml-2 text-xs opacity-75">({statusCounts[status]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Author and Sort Filters */}
        <div className="flex gap-4 flex-wrap">
          {/* Author Filter */}
          {authors.length > 1 && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                Filter by Author
              </label>
              <select
                value={filterAuthor}
                onChange={(e) => setFilterAuthor(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 
                         bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Authors</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Order */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Sort by Date
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 
                       bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {sortedPosts.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-16 h-16" />}
          title={filterStatus === 'all' ? 'No posts yet' : `No ${filterStatus.toLowerCase()} posts`}
          description={filterStatus === 'all' 
            ? "Start creating engaging content for your audience. Your first post is just a click away!" 
            : `You don't have ${filterStatus.toLowerCase()} posts at the moment.`}
          action={{
            label: 'Create Your First Post',
            onClick: () => router.push('/dashboard/posts/new'),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-slate-200">{pageStart + 1}</span>
              {' '}–{' '}
              <span className="font-medium text-slate-900 dark:text-slate-200">{pageEnd}</span> of{' '}
              <span className="font-medium text-slate-900 dark:text-slate-200">{sortedPosts.length}</span> posts
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 dark:text-slate-400">Rows</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                >
                  Prev
                </Button>
                <span className="text-xs text-slate-600 dark:text-slate-400 px-2">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {paginatedPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {post.title}
                      </h2>
                      {getStatusBadge(post)}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <Tooltip content="Author">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author.displayName || post.author.username || post.author.name}
                        </div>
                      </Tooltip>
                      <span>|</span>
                      <Tooltip content="Comment count">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {post.commentCount ?? 0} comments
                        </div>
                      </Tooltip>
                      <span>|</span>
                      <Tooltip content={getStatusDate(post)}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {getStatusDate(post)}
                        </div>
                      </Tooltip>
                      <span>|</span>
                      <Tooltip content="View live post">
                        <Link 
                          href={`/blog/${post.slug}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          <Eye className="w-4 h-4" />
                          View Post
                        </Link>
                      </Tooltip>
                      <span>|</span>
                      <Tooltip content="Moderate comments">
                        <Link
                          href={`/dashboard/comments?postId=${post.id}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Comments
                        </Link>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Tooltip content="Edit this post">
                      <Link href={`/dashboard/posts/edit/${post.id}`}>
                        <Button size="sm" className="flex items-center gap-1">
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </Link>
                    </Tooltip>
                    <Tooltip content="Delete this post permanently">
                      <Button
                        size="sm"
                        onClick={() => handleDelete(post.id, post.title)}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-center pt-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
              >
                First
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                Prev
              </Button>
              <span className="text-xs text-slate-600 dark:text-slate-400 px-2">
                Page {safePage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
              >
                Next
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


