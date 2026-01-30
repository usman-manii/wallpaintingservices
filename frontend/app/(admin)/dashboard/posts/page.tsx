'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { Trash2, Eye, Edit, Plus, Calendar, User, FileText, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  scheduledFor?: string;
  publishedAt?: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    displayName: string;
  };
  categories?: { name: string }[];
  tags?: { name: string }[];
}

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

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Always load the full admin post list once; filters are applied client-side
      const params = new URLSearchParams();
      params.append('take', '1000');

      const data = await fetchAPI(`/blog/admin/posts?${params.toString()}&_=${Date.now()}`);

      // Validate that data is an array
      if (!Array.isArray(data)) {
        console.error('API returned non-array data:', data);
        showError('Invalid data format received from server');
        setPosts([]);
        setAuthors([]);
        return;
      }
      
      setPosts(data);
      
      // Extract unique authors only if we have posts
      if (data.length > 0) {
        const uniqueAuthors = Array.from(
          new Map(data.map((post: Post) => [post.author.id, {
            id: post.author.id,
            name: post.author.displayName || post.author.username
          }])).values()
        );
        setAuthors(uniqueAuthors as Array<{ id: string; name: string }>);
      } else {
        setAuthors([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      showError('Failed to fetch posts');
      setPosts([]);
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  // NOTE: We no longer refetch on filter changes; filters are applied client-side

  const handleDelete = async (id: string, title: string) => {
    confirm(
      'Delete Post',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      async () => {
        try {
          try {
            await fetchAPI(`/blog/${id}`, {
              method: 'DELETE',
            });
            success('Post deleted successfully');
            fetchPosts();
          } catch (error: any) {
            console.error('Error deleting post:', error);
            showError(error.message || 'Failed to delete post');
          }
        } catch (error) {
          console.error('Error deleting post:', error);
          showError('An error occurred while deleting');
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
            : `You don't have any ${filterStatus.toLowerCase()} posts at the moment.`}
          action={{
            label: 'Create Your First Post',
            onClick: () => window.location.href = '/dashboard/posts/new',
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-4">
          {sortedPosts.map((post) => (
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
                      <span>•</span>
                      <Tooltip content={getStatusDate(post)}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {getStatusDate(post)}
                        </div>
                      </Tooltip>
                      <span>•</span>
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
        </div>
      )}
    </div>
  );
}
