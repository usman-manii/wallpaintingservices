import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, FileText } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  publishedAt?: string;
  updatedAt: string;
  viewCount: number;
}

async function getPublishedPages(): Promise<Page[]> {
  try {
    const res = await fetch(`${API_URL}/pages/public`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!res.ok) {
      console.error('Failed to fetch pages:', res.status);
      return [];
    }
    
    const data = await res.json();
    const pages = Array.isArray(data) ? data : [];
    
    // Filter to only published pages and sort by published date
    return pages
      .filter((page: any) => page.status === 'PUBLISHED')
      .sort((a: any, b: any) => {
        const dateA = new Date(a.publishedAt || a.updatedAt).getTime();
        const dateB = new Date(b.publishedAt || b.updatedAt).getTime();
        return dateB - dateA;
      });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export default async function PagesPage() {
  const pages = await getPublishedPages();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">All Pages</h1>
        <p className="text-xl text-slate-600">
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
                      <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {page.title}
                      </h2>
                    </Link>
                    {page.description && (
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {page.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    {page.publishedAt 
                      ? new Date(page.publishedAt).toLocaleDateString()
                      : new Date(page.updatedAt).toLocaleDateString()
                    }
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
        <div className="bg-slate-50 border border-dashed rounded-xl p-12 text-center text-slate-500 max-w-2xl mx-auto">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium mb-2">No pages published yet</p>
          <p className="text-sm">Check back later for new content.</p>
        </div>
      )}
    </div>
  );
}
