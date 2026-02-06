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
import TagExplorer from '@/components/tags/TagExplorer';
import logger from '@/lib/logger';

// Types
interface Post {
  id: string;
  title?: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string | null;
  publishedAt?: string;
  author?: { firstName?: string; lastName?: string; nickname?: string };
  categories?: { name?: string; slug?: string }[];
}

interface SiteSettings {
  homePageLayout: 'single' | 'dual';
  siteName: string;
  description: string;
  blogPageId?: string | null;
}

type BlogPageSearchParams = {
  page?: string;
  tag?: string;
  category?: string;
};

const PAGE_SIZE = 10;

// Data Fetching
async function getData(page: number) {
  try {
    const skip = (page - 1) * PAGE_SIZE;
    const take = PAGE_SIZE + 1;
    // Parallel fetch for perf
    const [settingsRes, postsRes] = await Promise.all([
      fetch(`${API_URL}/settings/public`, {
        next: { revalidate: 300 } // Cache for 5 minutes
      }),
      fetch(`${API_URL}/blog?take=${take}&skip=${skip}`, {
        next: { revalidate: 60 } // Cache blog posts for 1 minute
      })
    ]);

    let settings: SiteSettings = { homePageLayout: 'single', siteName: 'Blog', description: '', blogPageId: null };
    if (settingsRes.ok) {
        try {
            const data = await settingsRes.json();
            settings = parseSettings(data);
        } catch (e: unknown) {
            logger.error('Failed to parse settings JSON', e, { component: 'BlogPage' });
        }
    }

    let posts: Post[] = [];
    if (postsRes.ok) {
        try {
            const postsData = await postsRes.json();
            const list = Array.isArray(postsData)
              ? postsData
              : (postsData && typeof postsData === 'object' && Array.isArray((postsData as { posts?: unknown }).posts)
                ? (postsData as { posts: unknown[] }).posts
                : []);
            posts = list.map(toPost).filter((post): post is Post => post !== null);
        } catch (e: unknown) {
            logger.error('Failed to parse posts JSON', e, { component: 'BlogPage' });
        }
    }

    const hasNextPage = posts.length > PAGE_SIZE;
    const safePosts = hasNextPage ? posts.slice(0, PAGE_SIZE) : posts;

    return {
      settings,
      posts: safePosts,
      pagination: {
        page,
        hasNextPage,
        hasPrevPage: page > 1,
      },
    };
  } catch (error: unknown) {
    logger.error('Error fetching data', error, { component: 'BlogPage' });
    return {
      settings: { homePageLayout: 'single', siteName: 'Blog', description: '', blogPageId: null },
      posts: [],
      pagination: {
        page,
        hasNextPage: false,
        hasPrevPage: page > 1,
      },
    };
  }
}

function parseSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== 'object') {
    return { homePageLayout: 'single', siteName: 'Blog', description: '', blogPageId: null };
  }
  const obj = value as Record<string, unknown>;
  const homePageLayout = obj.homePageLayout === 'dual' ? 'dual' : 'single';
  return {
    homePageLayout,
    siteName: typeof obj.siteName === 'string' ? obj.siteName : 'Blog',
    description: typeof obj.description === 'string' ? obj.description : '',
    blogPageId: typeof obj.blogPageId === 'string' ? obj.blogPageId : null,
  };
}

function toPost(value: unknown): Post | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.slug !== 'string') return null;
  const authorObj = obj.author && typeof obj.author === 'object' ? (obj.author as Record<string, unknown>) : null;
  const categories = Array.isArray(obj.categories) ? obj.categories : [];
  return {
    id: obj.id,
    slug: obj.slug,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    excerpt: typeof obj.excerpt === 'string' ? obj.excerpt : undefined,
    featuredImage: typeof obj.featuredImage === 'string' ? obj.featuredImage : null,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt : undefined,
    author: authorObj ? {
      firstName: typeof authorObj.firstName === 'string' ? authorObj.firstName : undefined,
      lastName: typeof authorObj.lastName === 'string' ? authorObj.lastName : undefined,
      nickname: typeof authorObj.nickname === 'string' ? authorObj.nickname : undefined,
    } : undefined,
    categories: categories.flatMap((category) => {
      if (!category || typeof category !== 'object') return [];
      const cat = category as Record<string, unknown>;
      if (typeof cat.slug !== 'string') return [];
      return [{ slug: cat.slug, name: typeof cat.name === 'string' ? cat.name : undefined }];
    }),
  };
}

export default async function BlogPage({ searchParams }: { searchParams?: BlogPageSearchParams }) {
  const pageParam = searchParams?.page;
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const { settings, posts, pagination } = await getData(page);
  
  // Otherwise, render the default blog listing
  const isDualColumn = settings.homePageLayout === 'dual';
  const hasCustomBlogPage = Boolean(settings.blogPageId);
  const buildPageLink = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (searchParams?.tag) params.set('tag', searchParams.tag);
    if (searchParams?.category) params.set('category', searchParams.category);
    if (pageNumber > 1) params.set('page', pageNumber.toString());
    const query = params.toString();
    return query ? `/blog?${query}` : '/blog';
  };

  const paginationControls = !hasCustomBlogPage && (pagination.hasNextPage || pagination.hasPrevPage) ? (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
      <div className="text-sm text-muted-foreground">
        Page {pagination.page}
      </div>
      <div className="flex items-center gap-2">
        {pagination.hasPrevPage ? (
          <Link href={buildPageLink(Math.max(1, pagination.page - 1))}>
            <Button variant="outline">
              Previous
            </Button>
          </Link>
        ) : (
          <Button variant="outline" disabled>
            Previous
          </Button>
        )}
        {pagination.hasNextPage ? (
          <Link href={buildPageLink(pagination.page + 1)}>
            <Button>
              Next
            </Button>
          </Link>
        ) : (
          <Button disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  ) : null;

  const mainContent = hasCustomBlogPage ? (
    <PageByIdRenderer pageId={settings.blogPageId as string} />
  ) : (
    <>
      {posts.length > 0 ? (
        <>
          {posts.map(post => (
            <article key={post.id} className="flex flex-col bg-card rounded-xl shadow-elevation-1 border border-border overflow-hidden hover:shadow-elevation-2 transition-shadow">
              {post.featuredImage && (
                <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-muted">
                   <img 
                      src={post.featuredImage} 
                      alt={post.title || 'Post'}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                   />
                </div>
              )}
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                   <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}
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
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {post.title || 'Untitled'}
                  </h2>
                </Link>

                <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt || ''}
                </p>

                <Link href={`/blog/${post.slug}`}>
                  <Button variant="outline">
                    Read Article <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
          {paginationControls}
        </>
      ) : (
         <div className="bg-muted border border-dashed rounded-xl p-12 text-center text-muted-foreground">
            <p className="text-lg">No blog posts published yet.</p>
         </div>
      )}
    </>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      {!hasCustomBlogPage && (
        <>
          {/* Blog Header / Hero */}
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-4">{settings.siteName}</h1>
            <p className="text-xl text-muted-foreground">{settings.description}</p>
          </div>

          <div className="mb-10">
            <TagExplorer />
          </div>
        </>
      )}

      <div
        className={`grid gap-8 ${
          isDualColumn
            ? 'lg:grid-cols-3'
            : hasCustomBlogPage
              ? 'grid-cols-1'
              : 'grid-cols-1 max-w-4xl mx-auto'
        }`}
      >
        
        {/* Main Content Column */}
        <div className={`${isDualColumn ? 'lg:col-span-2' : ''} space-y-8`}>
          {mainContent}
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
                 <div className="bg-sidebar rounded-xl p-6 text-sidebar-foreground text-center shadow-lg border border-border">
                    <h3 className="font-bold text-xl mb-2">Need Painting?</h3>
                    <p className="mb-4 text-muted-foreground text-sm">Get the best wall painting services in UAE.</p>
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
                    <button type="submit" className="absolute right-2 top-2.5 text-muted-foreground hover:text-primary">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            </CardContent>
        </Card>
    )
}


