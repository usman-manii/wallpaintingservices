import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TrendingUp } from 'lucide-react';
import { API_URL } from '@/lib/api';

async function getTrendingPosts() {
    try {
        // Mocking trending logic by fetching random or specific endpoint if available
        // Ideally: /blog/trending or sort by views
        const res = await fetch(`${API_URL}/blog?limit=4`, { next: { revalidate: 3600 } }); 
        if (!res.ok) return [];
        try {
          const data = await res.json();
          // Just return the first few as trending for now
          const posts = Array.isArray(data) ? data : (data.posts || []);
          return posts.reverse().slice(0, 4);
        } catch {
          return [];
        } 
      } catch (error) {
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
          {posts.map((post: any, index: number) => (
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
