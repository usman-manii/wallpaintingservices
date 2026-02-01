// frontend/app/blog/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowRight, Calendar, User, Tag } from 'lucide-react';
import LatestPostsWidget from '@/components/widgets/LatestPostsWidget';
import TrendingPostsWidget from '@/components/widgets/TrendingPostsWidget';
import UpcomingPostsWidget from '@/components/widgets/UpcomingPostsWidget';
import PageByIdRenderer from '@/components/PageByIdRenderer';
import { API_URL } from '@/lib/api';

// Types
interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string | null;
  publishedAt: string;
  author: { firstName: string; lastName: string; nickname: string };
  categories: { name: string; slug: string }[];
}

interface SiteSettings {
  homePageLayout: 'single' | 'dual';
  siteName: string;
  description: string;
  blogPageId?: string | null;
}

// Data Fetching
async function getData() {
  try {
    // Parallel fetch for perf
    const [settingsRes, postsRes] = await Promise.all([
      fetch(`${API_URL}/settings/public`, {
        next: { revalidate: 300 } // Cache for 5 minutes
      }),
      fetch(`${API_URL}/blog?take=20`, {
        next: { revalidate: 60 } // Cache blog posts for 1 minute
      })
    ]);

    let settings: SiteSettings = { homePageLayout: 'single', siteName: 'Blog', description: '', blogPageId: null };
    if (settingsRes.ok) {
        try {
            const data = await settingsRes.json();
            if (data) settings = data;
        } catch (e) {
            console.error('Failed to parse settings JSON', e);
        }
    }

    let posts: Post[] = [];
    if (postsRes.ok) {
        try {
            const postsData = await postsRes.json();
            posts = Array.isArray(postsData) ? postsData : (postsData?.posts || []);
        } catch (e) {
            console.error('Failed to parse posts JSON', e);
        }
    }

    return {
      settings,
      posts,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      settings: { homePageLayout: 'single', siteName: 'Blog', description: '', blogPageId: null },
      posts: [],
    };
  }
}

export default async function BlogPage() {
  const { settings, posts } = await getData();
  
  // If a custom blog page is selected, render that page instead
  if (settings.blogPageId) {
    return <PageByIdRenderer pageId={settings.blogPageId} />;
  }
  
  // Otherwise, render the default blog listing
  const isDualColumn = settings.homePageLayout === 'dual';

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Blog Header / Hero */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{settings.siteName}</h1>
        <p className="text-xl text-slate-600">{settings.description}</p>
      </div>

      <div className={`grid gap-8 ${isDualColumn ? 'lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
        
        {/* Main Content Column */}
        <div className={`${isDualColumn ? 'lg:col-span-2' : ''} space-y-8`}>
          {posts.length > 0 ? (
            posts.map(post => (
              <article key={post.id} className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                {post.featuredImage && (
                  <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-slate-100">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img 
                        src={post.featuredImage} 
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                     />
                  </div>
                )}
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                     <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.publishedAt).toLocaleDateString()}
                     </span>
                     {post.author && (
                        <span className="flex items-center gap-1">
                             <User className="w-4 h-4" />
                             {post.author.nickname || post.author.firstName || 'Admin'}
                        </span>
                     )}
                     {post.categories && post.categories.length > 0 && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                            <Tag className="w-4 h-4" />
                            {post.categories[0].name}
                        </span>
                     )}
                  </div>

                  <Link href={`/blog/${post.slug}`} className="block group">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="text-slate-600 leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline">
                      Read Article <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </article>
            ))
          ) : (
             <div className="bg-slate-50 border border-dashed rounded-xl p-12 text-center text-slate-500">
                <p className="text-lg">No blog posts published yet.</p>
             </div>
          )}
        </div>

        {/* Sidebar Column (Conditional) */}
        {isDualColumn && (
          <aside className="space-y-8">
             <div className="sticky top-24 space-y-8">
                 <SearchBar />
                 <TrendingPostsWidget />
                 <LatestPostsWidget />
                 <UpcomingPostsWidget />
                 
                 {/* Ad / Promo Placeholder */}
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white text-center shadow-lg border border-slate-700/50">
                    <h3 className="font-bold text-xl mb-2 text-primary-100">Need Painting?</h3>
                    <p className="mb-4 text-slate-300 text-sm">Get the best wall painting services in UAE.</p>
                    <Link href="/get-quote">
                        <Button variant="secondary" size="sm" className="w-full font-medium hover:bg-emerald-500 hover:text-white transition-colors">
                            Get Quote
                        </Button>
                    </Link>
                 </div>
             </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function SearchBar() {
    return (
        <Card>
            <CardContent className='pt-6'>
                <form action="/search" className="relative">
                    <input 
                        type="text" 
                        placeholder="Search articles..." 
                        className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="absolute right-2 top-2.5 text-slate-400 hover:text-blue-500">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            </CardContent>
        </Card>
    )
}
