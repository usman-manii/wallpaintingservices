'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ThumbsUp, ThumbsDown, Flag, CornerDownRight } from 'lucide-react';
import logger from '@/lib/logger';
import { getErrorMessage } from '@/lib/error-utils';

type CommentUser = {
  displayName?: string;
};

type Comment = {
  id: string;
  authorName?: string;
  user?: CommentUser | null;
  createdAt?: string;
  content?: string;
  upvotes?: number;
  downvotes?: number;
  replies?: Comment[];
};

export default function CommentSection({ postId }: { postId: string }) {
  const { error: showError } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [form, setForm] = useState({ name: '', email: '', content: '', parentId: '' });
  const [loading, setLoading] = useState(false);
  const errorShownRef = useRef<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

  async function loadComments() {
    try {
      errorShownRef.current = null; // Reset error tracking on new load
      const data = await fetchAPI<Comment[]>(`/comments/post/${postId}`);
      setComments(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const errorMsg = getErrorMessage(e, 'Failed to load comments');
      // Only show error once per unique error message
      if (errorShownRef.current !== errorMsg) {
        errorShownRef.current = errorMsg;
        logger.error('Failed to load comments', e, { component: 'CommentSection', postId });
        showError(errorMsg);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchAPI('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, postId, parentId: replyTo || undefined })
      });
      setForm({ name: '', email: '', content: '', parentId: '' });
      setReplyTo(null);
      errorShownRef.current = null; // Reset on success
      loadComments();
    } catch (e: unknown) {
      const errorMsg = getErrorMessage(e, 'Failed to post comment');
      // Only show error once per submit attempt
      if (errorShownRef.current !== errorMsg) {
        errorShownRef.current = errorMsg;
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleVote = async (id: string, type: 'up' | 'down') => {
    setBusyId(id);
    try {
      await fetchAPI(`/comments/${id}/vote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(type === 'up' ? { up: true } : { down: true }),
      });
      loadComments();
    } catch (e: unknown) {
      showError(getErrorMessage(e, 'Failed to vote'));
    } finally {
      setBusyId(null);
    }
  };

  const handleFlag = async (id: string) => {
    setBusyId(id);
    try {
      await fetchAPI(`/comments/${id}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User flag' }),
      });
      showError('Comment flagged for review');
    } catch (e: unknown) {
      showError(getErrorMessage(e, 'Failed to flag'));
    } finally {
      setBusyId(null);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`bg-muted/60 p-4 rounded-lg mb-3 ${depth > 0 ? 'ml-6 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}>
      <div className="flex justify-between mb-2">
        <div className="font-semibold">{comment.authorName || comment.user?.displayName || 'Anonymous'}</div>
        <div className="text-muted-foreground text-sm">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}</div>
      </div>
      <p className="text-foreground mb-3 whitespace-pre-wrap">{comment.content || ''}</p>
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <button
          disabled={busyId === comment.id}
          onClick={() => handleVote(comment.id, 'up')}
          className="flex items-center gap-1 hover:text-green-600"
        >
          <ThumbsUp size={16} /> {comment.upvotes || 0}
        </button>
        <button
          disabled={busyId === comment.id}
          onClick={() => handleVote(comment.id, 'down')}
          className="flex items-center gap-1 hover:text-red-500"
        >
          <ThumbsDown size={16} /> {comment.downvotes || 0}
        </button>
        <button
          disabled={busyId === comment.id}
          onClick={() => setReplyTo(comment.id)}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <CornerDownRight size={16} /> Reply
        </button>
        <button
          disabled={busyId === comment.id}
          onClick={() => handleFlag(comment.id)}
          className="flex items-center gap-1 hover:text-amber-600"
        >
          <Flag size={16} /> Flag
        </button>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-bold mb-6">Comments ({comments.length})</h3>
      
      <div className="space-y-6 mb-10">
        {comments.map((comment) => renderComment(comment))}
      </div>

      <form onSubmit={handleSubmit} className="bg-card p-6 border rounded-xl shadow-sm">
        <h4 className="font-bold mb-4">{replyTo ? 'Reply to comment' : 'Leave a Reply'}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input 
            type="text" placeholder="Name" required
            className="border p-2 rounded"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
           <input 
            type="email" placeholder="Email" required
            className="border p-2 rounded"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
          />
        </div>
        <textarea 
          placeholder="Your comment..." required
          className="w-full border p-2 rounded h-24 mb-4"
          value={form.content}
          onChange={e => setForm({...form, content: e.target.value})}
        />
        {replyTo && (
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <span>Replying to comment</span>
            <button type="button" className="text-blue-600 underline" onClick={() => setReplyTo(null)}>Cancel reply</button>
          </div>
        )}
        <button 
          disabled={loading}
          className="bg-black text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}


