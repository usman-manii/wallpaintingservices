'use client';

import logger from '@/lib/logger';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchAPI } from '@/lib/api';
import { Tooltip, InfoTooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Flag, 
  Search,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  User,
  Mail,
  Globe,
  Calendar,
  FileText,
  CheckSquare,
  X,
  Pin,
  CheckCircle2
} from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';
import { useSearchParams } from 'next/navigation';

type CommentType = {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  ipAddress?: string;
  createdAt: string;
  isApproved: boolean;
  isSpam: boolean;
  isFlagged: boolean;
  flagReason?: string;
  isPinned?: boolean;
  isResolved?: boolean;
  upvotes?: number;
  downvotes?: number;
  post: { id: string; title: string; slug: string };
  user?: { username: string; displayName: string };
  replies?: CommentType[];
};

type Tab = 'all' | 'pending' | 'approved' | 'spam' | 'flagged';

type CommentStats = {
  total: number;
  approved: number;
  pending: number;
  spam: number;
  flagged: number;
};

const DEFAULT_STATS: CommentStats = {
  total: 0,
  approved: 0,
  pending: 0,
  spam: 0,
  flagged: 0,
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const parseBoolean = (value: unknown, fallback = false): boolean => (
  typeof value === 'boolean' ? value : fallback
);

const parseNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const parsePostSummary = (value: unknown): CommentType['post'] | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  const title = parseString(value.title);
  const slug = parseString(value.slug);
  if (!id || !title || !slug) {
    return null;
  }
  return { id, title, slug };
};

const parseUserSummary = (value: unknown): CommentType['user'] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const username = parseString(value.username);
  const displayName = parseString(value.displayName);
  if (!username && !displayName) {
    return undefined;
  }
  return { username, displayName };
};

const parseComment = (value: unknown): CommentType | null => {
  if (!isRecord(value)) {
    return null;
  }
  const id = parseString(value.id);
  if (!id) {
    return null;
  }
  const post = parsePostSummary(value.post);
  if (!post) {
    return null;
  }
  const replies = Array.isArray(value.replies)
    ? value.replies.map(parseComment).filter((reply): reply is CommentType => !!reply)
    : undefined;
  return {
    id,
    content: parseString(value.content),
    authorName: parseString(value.authorName, 'Anonymous'),
    authorEmail: parseString(value.authorEmail),
    authorWebsite: parseString(value.authorWebsite) || undefined,
    ipAddress: parseString(value.ipAddress) || undefined,
    createdAt: parseString(value.createdAt),
    isApproved: parseBoolean(value.isApproved),
    isSpam: parseBoolean(value.isSpam),
    isFlagged: parseBoolean(value.isFlagged),
    flagReason: parseString(value.flagReason) || undefined,
    isPinned: parseBoolean(value.isPinned),
    isResolved: parseBoolean(value.isResolved),
    upvotes: parseNumber(value.upvotes),
    downvotes: parseNumber(value.downvotes),
    post,
    user: parseUserSummary(value.user),
    replies,
  };
};

const parseCommentsList = (value: unknown): CommentType[] => (
  Array.isArray(value)
    ? value.map(parseComment).filter((comment): comment is CommentType => !!comment)
    : []
);

const parseStats = (value: unknown): CommentStats => {
  if (!isRecord(value)) {
    return DEFAULT_STATS;
  }
  return {
    total: parseNumber(value.total),
    approved: parseNumber(value.approved),
    pending: parseNumber(value.pending),
    spam: parseNumber(value.spam),
    flagged: parseNumber(value.flagged),
  };
};

export default function CommentModerationPage() {
  const { success, error: showError, warning, info } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('approved');
  const [comments, setComments] = useState<CommentType[]>([]);
  const [stats, setStats] = useState<CommentStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(false);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'most-upvoted'>('newest');
  const [postFilter, setPostFilter] = useState<string>('all');
  const [collapsedReplies, setCollapsedReplies] = useState<Record<string, boolean>>({});
  const errorShownRef = useRef<{ [key: string]: boolean }>({});

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = `/comments/moderation/${activeTab}`;
      const data = await fetchAPI(endpoint, { redirectOn401: false, cache: 'no-store' });
      setComments(parseCommentsList(data));
      errorShownRef.current['comments'] = false; // Reset on success
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Failed to fetch comments');
      if (!errorShownRef.current['comments']) {
        errorShownRef.current['comments'] = true;
        logger.error('Error fetching comments:', error);
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, showError]);

const fetchStats = useCallback(async () => {
    try {
      const data = await fetchAPI('/comments/moderation/stats', { redirectOn401: false, cache: 'no-store' });
      setStats(parseStats(data));
      errorShownRef.current['stats'] = false; // Reset on success
    } catch (error: unknown) {
      const errorMsg = getErrorMessage(error, 'Failed to fetch comment stats');
      if (!errorShownRef.current['stats']) {
        errorShownRef.current['stats'] = true;
        logger.error('Error fetching stats:', error);
        showError(errorMsg);
      }
    }
}, [showError]);

  useEffect(() => {
    fetchComments();
    fetchStats();
  }, [activeTab, fetchComments, fetchStats]);

  useEffect(() => {
    const postId = searchParams.get('postId');
    if (postId) {
      setPostFilter(postId);
    }
  }, [searchParams]);

  const handleApprove = async (id: string) => {
    try {
      await fetchAPI(`/comments/${id}/approve`, { method: 'PATCH', redirectOn401: false, cache: 'no-store' });
      success('Comment approved successfully!');
      fetchComments();
      fetchStats();
    } catch (error: unknown) {
      logger.error('Error approving comment:', error);
      showError(getErrorMessage(error, 'Failed to approve comment'));
    }
  };

  const handleReject = async (id: string) => {
    confirm(
      'Mark as Spam',
      'Are you sure you want to mark this comment as spam?',
      async () => {
        try {
          await fetchAPI(`/comments/${id}/reject`, { method: 'PATCH', redirectOn401: false, cache: 'no-store' });
          success('Comment marked as spam!');
          fetchComments();
          fetchStats();
        } catch (error: unknown) {
          logger.error('Error rejecting comment:', error);
          showError(getErrorMessage(error, 'Failed to reject comment'));
        }
      },
      'danger'
    );
  };

  const handlePin = async (id: string, pinned: boolean) => {
    try {
      await fetchAPI(`/comments/${id}/pin`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success(pinned ? 'Comment pinned' : 'Comment unpinned');
      fetchComments();
    } catch (error: unknown) {
      logger.error('Error pinning comment:', error);
      showError(getErrorMessage(error, 'Failed to pin comment'));
    }
  };

  const handleResolve = async (id: string, resolved: boolean) => {
    try {
      await fetchAPI(`/comments/${id}/resolved`, {
        method: 'PATCH',
        body: JSON.stringify({ resolved }),
        redirectOn401: false,
        cache: 'no-store',
      });
      success(resolved ? 'Marked resolved' : 'Marked unresolved');
      fetchComments();
    } catch (error: unknown) {
      logger.error('Error resolving comment:', error);
      showError(getErrorMessage(error, 'Failed to update resolution'));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedComments.size === 0) {
      info('No comments selected');
      return;
    }

    confirm(
      'Bulk Approve',
      `Approve ${selectedComments.size} selected comment${selectedComments.size !== 1 ? 's' : ''}?`,
      async () => {
        try {
          await fetchAPI('/comments/moderation/bulk-approve', {
            method: 'POST',
            body: JSON.stringify({ ids: Array.from(selectedComments) }),
            redirectOn401: false,
            cache: 'no-store',
          });
          success(`${selectedComments.size} comment${selectedComments.size !== 1 ? 's' : ''} approved!`);
          setSelectedComments(new Set());
          fetchComments();
          fetchStats();
        } catch (error: unknown) {
          logger.error('Error bulk approving:', error);
          showError(getErrorMessage(error, 'Failed to bulk approve'));
        }
      },
      'success'
    );
  };

  const handleBulkReject = async () => {
    if (selectedComments.size === 0) {
      info('No comments selected');
      return;
    }

    confirm(
      'Bulk Mark as Spam',
      `Mark ${selectedComments.size} selected comment${selectedComments.size !== 1 ? 's' : ''} as spam?`,
      async () => {
        try {
          await fetchAPI('/comments/moderation/bulk-reject', {
            method: 'POST',
            body: JSON.stringify({ ids: Array.from(selectedComments) }),
            redirectOn401: false,
            cache: 'no-store',
          });
          success(`${selectedComments.size} comment${selectedComments.size !== 1 ? 's' : ''} marked as spam!`);
          setSelectedComments(new Set());
          fetchComments();
          fetchStats();
        } catch (error: unknown) {
          logger.error('Error bulk rejecting:', error);
          showError(getErrorMessage(error, 'Failed to bulk reject'));
        }
      },
      'danger'
    );
  };

  const toggleCommentSelection = (id: string) => {
    const newSelected = new Set(selectedComments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedComments(newSelected);
  };

  const postOptions = Array.from(
    new Map(comments.map((comment) => [comment.post.id, comment.post.title])).entries()
  ).map(([id, title]) => ({ id, title }));
  const missingPostFilter = postFilter !== 'all' && !postOptions.some((post) => post.id === postFilter);

  const filteredComments = comments.filter(comment => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.post.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPost = postFilter === 'all' || comment.post.id === postFilter;
    return matchesSearch && matchesPost;
  });

  const sortedComments = [...filteredComments].sort((a, b) => {
    if (sortOrder === 'most-upvoted') {
      return (b.upvotes || 0) - (a.upvotes || 0);
    }
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'oldest' ? aDate - bDate : bDate - aDate;
  });

  const allSelected = sortedComments.length > 0 && sortedComments.every((comment) => selectedComments.has(comment.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(sortedComments.map((comment) => comment.id)));
    }
  };

  const toggleReplies = (id: string) => {
    setCollapsedReplies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Comment Moderation</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage and moderate user comments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Tooltip content="Total comments across all statuses">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total</div>
                </div>
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>
        <Tooltip content="Comments approved and visible">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Approved</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>
        <Tooltip content="Comments awaiting moderation">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Pending</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>
        <Tooltip content="Comments marked as spam">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.spam}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Spam</div>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>
        <Tooltip content="Comments flagged by users or AI">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.flagged}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Flagged</div>
                </div>
                <Flag className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </Tooltip>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        {(['all', 'approved', 'pending', 'spam', 'flagged'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab === 'all' ? `All (${stats.total})`
              : tab === 'approved' ? `Approved (${stats.approved})`
              : tab === 'pending' ? `Pending (${stats.pending})`
              : tab === 'spam' ? `Spam (${stats.spam})`
              : `Flagged (${stats.flagged})`}
          </button>
        ))}
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search comments, authors, or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="min-w-[200px]">
          <select
            value={postFilter}
            onChange={(e) => setPostFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
          >
            <option value="all">All Posts</option>
            {missingPostFilter && (
              <option value={postFilter}>Selected post</option>
            )}
            {postOptions.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <select
            value={sortOrder}
            onChange={(e) => {
              const value = e.target.value as typeof sortOrder;
              setSortOrder(value);
            }}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most-upvoted">Most upvoted</option>
          </select>
        </div>
        {selectedComments.size > 0 && (
          <>
            <Tooltip content="Approve selected comments">
              <Button onClick={handleBulkApprove} variant="secondary">
                <ThumbsUp className="w-4 h-4 mr-2" />
                Approve {selectedComments.size}
              </Button>
            </Tooltip>
            <Tooltip content="Mark selected as spam">
              <Button onClick={handleBulkReject} variant="danger">
                <ThumbsDown className="w-4 h-4 mr-2" />
                Reject {selectedComments.size}
              </Button>
            </Tooltip>
          </>
        )}
      </div>

      {/* Comments List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton lines={5} />
            </div>
          ) : sortedComments.length === 0 ? (
            <EmptyState
              icon={searchQuery ? <Search className="w-16 h-16" /> : <MessageSquare className="w-16 h-16" />}
              title={searchQuery ? 'No comments found' : `No ${activeTab} comments`}
              description={searchQuery ? 'Try adjusting your search terms' : `There are no ${activeTab} comments at this time`}
              variant={searchQuery ? 'search' : 'default'}
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span>{allSelected ? 'Deselect all' : 'Select all'} ({sortedComments.length})</span>
              </div>
              {sortedComments.map(comment => (
                <div key={comment.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedComments.has(comment.id)}
                      onChange={() => toggleCommentSelection(comment.id)}
                      className="mt-1"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {comment.user?.displayName || comment.authorName}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {comment.authorEmail}
                            {comment.ipAddress && ` - IP: ${comment.ipAddress}`}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-slate-700 dark:text-slate-300 mb-2">
                        {comment.content}
                      </div>

                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <Badge variant="outline" size="sm">
                          <ThumbsUp className="w-3 h-3 mr-1" /> {comment.upvotes || 0}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          <ThumbsDown className="w-3 h-3 mr-1" /> {comment.downvotes || 0}
                        </Badge>
                        {comment.replies && comment.replies.length > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          >
                            {collapsedReplies[comment.id] ? 'Show replies' : 'Hide replies'} ({comment.replies.length})
                          </button>
                        )}
                        {comment.isPinned && (
                          <Badge variant="warning" size="sm">
                            <Pin className="w-3 h-3 mr-1" /> Pinned
                          </Badge>
                        )}
                        {comment.isResolved && (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                          </Badge>
                        )}
                        <a
                          href={`/blog/${comment.post.slug}`}
                          target="_blank"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Post: {comment.post.title}
                        </a>

                        {comment.isFlagged && (
                          <Badge variant="warning" size="sm">
                            <Flag className="w-3 h-3 mr-1" />
                            Flagged: {comment.flagReason}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                       <Tooltip content="Approve this comment">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border-transparent"
                          onClick={() => handleApprove(comment.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Mark as spam">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReject(comment.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content={comment.isPinned ? 'Unpin comment' : 'Pin comment'}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePin(comment.id, !comment.isPinned)}
                        >
                          <Pin className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      <Tooltip content={comment.isResolved ? 'Mark unresolved' : 'Mark resolved'}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(comment.id, !comment.isResolved)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && !collapsedReplies[comment.id] && (
                    <div className="ml-12 mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <Badge size="sm" variant="default" className="mr-2">{reply.authorName}</Badge>
                          {reply.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {dialog}
    </div>
  );
}


