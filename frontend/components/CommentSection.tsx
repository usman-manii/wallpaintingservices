'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function CommentSection({ postId }: { postId: string }) {
  const { error: showError } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [loading, setLoading] = useState(false);
  const errorShownRef = useRef<string | null>(null);

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function loadComments() {
    try {
      errorShownRef.current = null; // Reset error tracking on new load
      const data = await fetchAPI(`/comments/post/${postId}`);
      setComments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to load comments";
      // Only show error once per unique error message
      if (errorShownRef.current !== errorMsg) {
        errorShownRef.current = errorMsg;
        console.error("Failed to load comments:", e);
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
        body: JSON.stringify({ ...form, postId })
      });
      setForm({ name: '', email: '', content: '' });
      errorShownRef.current = null; // Reset on success
      loadComments();
    } catch (e: any) {
      const errorMsg = e?.message || "Failed to post comment";
      // Only show error once per submit attempt
      if (errorShownRef.current !== errorMsg) {
        errorShownRef.current = errorMsg;
        showError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-bold mb-6">Comments ({comments.length})</h3>
      
      <div className="space-y-6 mb-10">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">{comment.authorName || comment.user?.name || 'Anonymous'}</span>
              <span className="text-gray-500 text-sm">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 border rounded-xl shadow-sm">
        <h4 className="font-bold mb-4">Leave a Reply</h4>
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
