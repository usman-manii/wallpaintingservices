'use client';

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
  X
} from 'lucide-react';

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
  post: { id: string; title: string; slug: string };
  user?: { username: string; displayName: string };
  replies?: CommentType[];
};

type Tab = 'pending' | 'approved' | 'spam' | 'flagged';

export default function CommentModerationPage() {
  const { success, error: showError, warning, info } = useToast();
  const { dialog, confirm } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [comments, setComments] = useState<CommentType[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, spam: 0, flagged: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const errorShownRef = useRef<{ [key: string]: boolean }>({});

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'approved' ? '/blog' : `/comments/moderation/${activeTab}`;
      const data = await fetchAPI(endpoint, { redirectOn401: false, cache: 'no-store' });
      setComments(Array.isArray(data) ? data : []);
      errorShownRef.current['comments'] = false; // Reset on success
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to fetch comments';
      if (!errorShownRef.current['comments']) {
        errorShownRef.current['comments'] = true;
        console.error('Error fetching comments:', error);
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await fetchAPI('/comments/moderation/stats', { redirectOn401: false, cache: 'no-store' });
      setStats(data || { total: 0, approved: 0, pending: 0, spam: 0, flagged: 0 });
      errorShownRef.current['stats'] = false; // Reset on success
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to fetch comment stats';
      if (!errorShownRef.current['stats']) {
        errorShownRef.current['stats'] = true;
        console.error('Error fetching stats:', error);
        showError(errorMsg);
      }
    }
  }, []);

  useEffect(() => {
    fetchComments();
    fetchStats();
  }, [activeTab, fetchComments, fetchStats]);

  const handleApprove = async (id: string) => {
    try {
      await fetchAPI(`/comments/${id}/approve`, { method: 'PATCH', redirectOn401: false, cache: 'no-store' });
      success('Comment approved successfully!');
      fetchComments();
      fetchStats();
    } catch (error: any) {
      console.error('Error approving comment:', error);
      showError(error.message || 'Failed to approve comment');
    }
  };

  const handleReject = async (id: string) => {
    confirm(
      'Mark as Spam',
      'Are you sure you want to mark this comment as spam?',
      async () => {
        try {
          try {
            await fetchAPI(`/comments/${id}/reject`, { method: 'PATCH', redirectOn401: false, cache: 'no-store' });
            success('Comment marked as spam!');
            fetchComments();
            fetchStats();
          } catch (error: any) {
            console.error('Error rejecting comment:', error);
            showError(error.message || 'Failed to reject comment');
          }        } catch (error) {
          console.error('Error rejecting comment:', error);
          showError('Failed to reject comment');
        }
      },
      'danger'
    );
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
          } catch (error: any) {
            console.error('Error bulk approving:', error);
            showError(error.message || 'Failed to bulk approve');
          }        } catch (error) {
          console.error('Error bulk approving:', error);
          showError('Failed to bulk approve');
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
          } catch (error: any) {
            console.error('Error bulk rejecting:', error);
            showError(error.message || 'Failed to bulk reject');
          }        } catch (error) {
          console.error('Error bulk rejecting:', error);
          showError('Failed to bulk reject');
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

  const filteredComments = comments.filter(comment => 
    comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
        {(['pending', 'spam', 'flagged'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search and Bulk Actions */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
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
          ) : filteredComments.length === 0 ? (
            <EmptyState
              icon={searchQuery ? <Search className="w-16 h-16" /> : <MessageSquare className="w-16 h-16" />}
              title={searchQuery ? 'No comments found' : `No ${activeTab} comments`}
              description={searchQuery ? 'Try adjusting your search terms' : `There are no ${activeTab} comments at this time`}
              variant={searchQuery ? 'search' : 'default'}
            />
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredComments.map(comment => (
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
                            {comment.ipAddress && ` • IP: ${comment.ipAddress}`}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-slate-700 dark:text-slate-300 mb-2">
                        {comment.content}
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <a
                          href={`/blog/${comment.post.slug}`}
                          target="_blank"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          📄 {comment.post.title}
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
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
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
