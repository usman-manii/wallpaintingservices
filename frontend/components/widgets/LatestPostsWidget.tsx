import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { API_URL } from '@/lib/api';
import logger from '@/lib/logger';

type LatestPost = {
  id: string;
  slug: string;
  title?: string;
  publishedAt?: string;
};

const toLatestPost = (value: unknown): LatestPost | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.slug !== 'string') return null;
  return {
    id: obj.id,
    slug: obj.slug,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt : undefined,
  };
};

async function getLatestPosts(): Promise<LatestPost[]> {
  try {
    const res = await fetch(`${API_URL}/blog?limit=5`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    try {
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : (data && typeof data === 'object' && Array.isArray((data as { posts?: unknown }).posts) ? (data as { posts: unknown[] }).posts : []);
      return list.map(toLatestPost).filter((post): post is LatestPost => post !== null);
    } catch {
      return [];
    }
  } catch (error) {
    logger.error('Failed to fetch latest posts widget', error, { component: 'LatestPostsWidget' });
    return [];
  }
}

export default async function LatestPostsWidget() {
  const posts = await getLatestPosts();

  if (!posts || posts.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Latest Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
              <Link href={`/blog/${post.slug}`} className="group">
                <h4 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h4>
                <span className="text-xs text-slate-500 mt-1 block">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
