// frontend/components/tags/TagExplorer.tsx
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import logger from '@/lib/logger';

type Tag = {
  id: string;
  slug: string;
  name?: string;
  featured?: boolean;
};

const toTag = (value: unknown): Tag | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.slug !== 'string') return null;
  return {
    id: obj.id,
    slug: obj.slug,
    name: typeof obj.name === 'string' ? obj.name : undefined,
    featured: typeof obj.featured === 'boolean' ? obj.featured : undefined,
  };
};

async function getTagData(): Promise<{ all: Tag[]; trending: Tag[] }> {
  try {
    const [allRes, trendingRes] = await Promise.all([
      fetch(`${API_URL}/blog/tags`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/blog/tags/trending`, { next: { revalidate: 120 } }),
    ]);

    const all = allRes.ok ? await allRes.json() : [];
    const trending = trendingRes.ok ? await trendingRes.json() : [];
    const allList = Array.isArray(all) ? all : [];
    const trendingList = Array.isArray(trending) ? trending : [];
    return {
      all: allList.map(toTag).filter((tag): tag is Tag => tag !== null),
      trending: trendingList.map(toTag).filter((tag): tag is Tag => tag !== null),
    };
  } catch (e) {
    logger.error('TagExplorer fetch error', e, { component: 'TagExplorer' });
    return { all: [], trending: [] };
  }
}

export default async function TagExplorer() {
  const { all, trending } = await getTagData();
  if (all.length === 0) return null;

  const featured = all.filter((t) => t.featured);

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Explore Tags</h3>
            <p className="text-sm text-slate-500">Trending, featured, and all tags in one place.</p>
          </div>
        </div>

        {trending.length > 0 && (
          <div>
            <div className="text-xs uppercase text-slate-500 mb-2">Trending</div>
            <div className="flex flex-wrap gap-2">
              {trending.map((tag) => (
                <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                  <Badge variant="error" size="lg">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        {featured.length > 0 && (
          <div>
            <div className="text-xs uppercase text-slate-500 mb-2">Featured</div>
            <div className="flex flex-wrap gap-2">
              {featured.map((tag) => (
                <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                  <Badge variant="warning" size="lg">
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs uppercase text-slate-500 mb-2">All Tags</div>
          <div className="flex flex-wrap gap-2">
            {all.slice(0, 60).map((tag) => (
              <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                <Badge variant="outline" size="lg">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
