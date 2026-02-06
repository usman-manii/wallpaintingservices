import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';
import { API_URL } from '@/lib/api';
import logger from '@/lib/logger';

type TrendingPost = {
  id: string;
  slug: string;
  title?: string;
};

const toTrendingPost = (value: unknown): TrendingPost | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.slug !== 'string') return null;
  return {
    id: obj.id,
    slug: obj.slug,
    title: typeof obj.title === 'string' ? obj.title : undefined,
  };
};

async function getTrendingPosts(): Promise<TrendingPost[]> {
  try {
    const res = await fetch(`${API_URL}/blog?limit=4`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    try {
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : (data && typeof data === 'object' && Array.isArray((data as { posts?: unknown }).posts) ? (data as { posts: unknown[] }).posts : []);
      return list.map(toTrendingPost).filter((post): post is TrendingPost => post !== null).reverse().slice(0, 4);
    } catch {
      return [];
    }
  } catch (error) {
    logger.error('Failed to fetch trending posts widget', error, { component: 'TrendingPostsWidget' });
    return [];
  }
}

export default async function TrendingPostsWidget() {
  const posts = await getTrendingPosts();

  if(!posts.length) return null;

  return (
    <Card className="mb-6 border-l-4 border-l-blue-600">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <CardTitle className="text-lg">Trending Now</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {posts.map((post, index: number) => (
            <li key={post.id} className="flex gap-3 items-start">
              <span className="text-2xl font-bold text-slate-200 leading-none -mt-1">{index + 1}</span>
              <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors font-medium text-sm leading-snug">
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
