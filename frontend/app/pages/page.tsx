import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';
import logger from '@/lib/logger';

interface Page {
  id: string;
  title?: string;
  slug: string;
  description?: string;
  publishedAt?: string;
  updatedAt?: string;
  viewCount?: number;
  status?: string;
}

async function getPublishedPages(): Promise<Page[]> {
  try {
    const res = await fetch(`${API_URL}/pages/public`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!res.ok) {
      logger.error('Failed to fetch pages', { status: res.status }, { component: 'PagesPage' });
      return [];
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    const pages = list.map(toPage).filter((page): page is Page => page !== null);

    return pages
      .filter((page) => page.status === 'PUBLISHED')
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.updatedAt || 0).getTime();
        const dateB = new Date(b.publishedAt || b.updatedAt || 0).getTime();
        return dateB - dateA;
      });
  } catch (error: unknown) {
    logger.error('Error fetching pages', error, { component: 'PagesPage' });
    return [];
  }
}

function toPage(value: unknown): Page | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.slug !== 'string') return null;
  return {
    id: obj.id,
    slug: obj.slug,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt : undefined,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    viewCount: typeof obj.viewCount === 'number' ? obj.viewCount : undefined,
    status: typeof obj.status === 'string' ? obj.status : undefined,
  };
}

export default async function PagesPage() {
  const pages = await getPublishedPages();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-4">All Pages</h1>
        <p className="text-xl text-muted-foreground">
          Browse all published pages on our website
        </p>
      </div>

      {/* Pages Grid */}
      {pages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {pages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <Link 
                      href={`/${page.slug === '(home)' ? '' : page.slug}`}
                      className="block group"
                    >
                      <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {page.title || 'Untitled'}
                      </h2>
                    </Link>
                    {page.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {page.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {page.publishedAt || page.updatedAt
                      ? new Date(page.publishedAt || page.updatedAt || 0).toLocaleDateString()
                      : ''}
                  </div>
                  <Link href={`/${page.slug === '(home)' ? '' : page.slug}`}>
                    <Button variant="outline" size="sm">
                      Read More
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-muted border border-dashed rounded-xl p-12 text-center text-muted-foreground max-w-2xl mx-auto">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium mb-2">No pages published yet</p>
          <p className="text-sm">Check back later for new content.</p>
        </div>
      )}
    </div>
  );
}
