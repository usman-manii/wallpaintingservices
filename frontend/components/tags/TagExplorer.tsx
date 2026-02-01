// frontend/components/tags/TagExplorer.tsx
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

async function getTagData() {
  try {
    const [allRes, trendingRes] = await Promise.all([
      fetch(`${API_URL}/blog/tags`, { next: { revalidate: 300 } }),
      fetch(`${API_URL}/blog/tags/trending`, { next: { revalidate: 120 } }),
    ]);

    const all = allRes.ok ? await allRes.json() : [];
    const trending = trendingRes.ok ? await trendingRes.json() : [];
    return { all: Array.isArray(all) ? all : [], trending: Array.isArray(trending) ? trending : [] };
  } catch (e) {
    console.error('TagExplorer fetch error', e);
    return { all: [], trending: [] };
  }
}

export default async function TagExplorer() {
  const { all, trending } = await getTagData();
  if (all.length === 0) return null;

  const featured = all.filter((t: any) => t.featured);

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
              {trending.map((tag: any) => (
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
              {featured.map((tag: any) => (
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
            {all.slice(0, 60).map((tag: any) => (
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
