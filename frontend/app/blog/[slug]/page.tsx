// frontend/app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import CommentSection from '@/components/CommentSection';
import ReadingProgress from '@/components/ReadingProgress';
import TableOfContents from '@/components/TableOfContents';
import ShareButtons from '@/components/ShareButtons';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Calendar, User, Clock, Eye } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { SafeHtml } from '@/components/SafeHtml';
import logger from '@/lib/logger';

type BlogAuthor = {
  username?: string;
  displayName?: string;
};

type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  featuredImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  author?: BlogAuthor;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  readingTime?: number;
  viewCount?: number;
  aiGenerated?: boolean;
  _count?: { comments?: number };
  views?: number;
};

type RelatedPost = Pick<BlogPost, 'id' | 'slug' | 'title' | 'publishedAt' | 'createdAt'>;

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/blog/${slug}`, {
       next: { revalidate: 60 } // Cache for 1 minute
    });
    if (!res.ok) return null;
    return res.json() as Promise<BlogPost>;
  } catch (error) {
    logger.error('Failed to load blog post', error);
    return null;
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function buildContentWithToc(html: string) {
  const headings: { id: string; text: string; level: number }[] = [];
  let index = 0;
  const contentWithIds = html.replace(/<h([2-3])[^>]*>(.*?)<\/h\1>/gi, (match, level, text) => {
    const plainText = text.replace(/<[^>]+>/g, '').trim();
    const id = `${slugify(plainText)}-${index++}`;
    headings.push({ id, text: plainText, level: parseInt(level, 10) });
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
  return { contentWithIds, toc: headings };
}

async function getRelatedPosts(postId: string): Promise<RelatedPost[]> {
  try {
    const res = await fetch(`${API_URL}/blog/${postId}/related`, {
      next: { revalidate: 120 } // Cache for 2 minutes
    });
    if (!res.ok) return [];
    return res.json() as Promise<RelatedPost[]>;
  } catch (error) {
    logger.error('Failed to load related posts', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not Found' };
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const imageUrl = post.ogImage || post.featuredImage || `${siteUrl}/default-blog-image.jpg`;
  const twitterCard =
    post.twitterCard === 'summary' ||
    post.twitterCard === 'summary_large_image' ||
    post.twitterCard === 'player' ||
    post.twitterCard === 'app'
      ? post.twitterCard
      : 'summary_large_image';
  const publishedTime = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
  const updatedTime = post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined;
  const authorName = post.author?.displayName || post.author?.username;
  const other: Record<string, string> = {
    ...(publishedTime ? { 'article:published_time': publishedTime } : {}),
    ...(updatedTime ? { 'article:modified_time': updatedTime } : {}),
    ...(authorName ? { 'article:author': authorName } : {}),
    'article:section': post.categories?.[0]?.name || 'Blog',
    'article:tag': post.tags?.map((t) => t.name).join(',') || '',
  };
  
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    keywords: post.seoKeywords?.join(', '),
    authors: [{ 
      name: post.author?.displayName || post.author?.username || 'AI Editor',
      url: `${siteUrl}/author/${post.author?.username}`
    }],
    creator: post.author?.displayName || post.author?.username || 'AI Editor',
    publisher: 'Wall Painting Services',
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.ogTitle || post.seoTitle || post.title,
      description: post.ogDescription || post.seoDescription || post.excerpt,
      url: postUrl,
      siteName: 'Wall Painting Services',
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: post.title,
      }],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author?.displayName || post.author?.username || 'AI Editor'],
      tags: post.tags?.map((t) => t.name) || [],
      section: post.categories?.[0]?.name,
    },
    twitter: {
      card: twitterCard,
      title: post.ogTitle || post.seoTitle || post.title,
      description: post.ogDescription || post.seoDescription || post.excerpt,
      images: [imageUrl],
      creator: '@wallpaintingservices',
      site: '@wallpaintingservices',
    },
    robots: {
      index: post.status === 'PUBLISHED',
      follow: true,
      nocache: false,
      googleBot: {
        index: post.status === 'PUBLISHED',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.id);

  // Build TOC and inject ids into content
  const { contentWithIds, toc } = buildContentWithToc(post.content || '');

  return (
    <div className="bg-background min-h-screen pb-20">
      <ReadingProgress targetId="post-content" />
      {/* Hero Header with Featured Image */}
      <div className="bg-sidebar text-sidebar-foreground py-20 px-4 relative overflow-hidden">
        {post.featuredImage && (
          <div className="absolute inset-0 opacity-20">
            <img 
              src={post.featuredImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="max-w-3xl mx-auto relative z-10">
          <Link href="/">
            <Button variant="ghost" className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent mb-8 pl-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <ArrowLeft size={16} className="mr-2" /> Back to Blog
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-sidebar-foreground">{post.title}</h1>
          <div className="flex flex-wrap gap-6 text-sidebar-foreground/80 text-sm">
            <span className="flex items-center gap-2">
              <Calendar size={16} />
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-2">
              <User size={16} />
              {post.author?.displayName || post.author?.username || 'AI Editor'}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} />
              {post.readingTime || 5} min read
            </span>
            <span className="flex items-center gap-2">
              <Eye size={16} />
              {post.viewCount || 0} views
            </span>
            {post.aiGenerated && (
              <span className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs">
                AI-Enhanced
              </span>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <article className="bg-card rounded-xl shadow-elevation-3 border border-border p-8 md:p-12 lg:col-span-8">
            <div 
              id="post-content"
              className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-12"
            >
              <SafeHtml html={contentWithIds} as="div" />
            </div>

            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="border-t border-border pt-8 mt-8">
                <h4 className="font-bold text-foreground mb-4">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/blog?category=${cat.slug}`}
                      className="text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-8 mt-8">
              <h4 className="font-bold text-foreground mb-4">Share this post</h4>
              <ShareButtons title={post.title} />
            </div>
          </article>

          {/* TOC / Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <TableOfContents items={toc} />
          </div>
          
          {/* Related Posts - 4 Column Horizontal Layout */}
          {relatedPosts && relatedPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedPosts.map((relatedPost, index: number) => {
                    // Safe date handling
                    const dateValue = relatedPost.publishedAt || relatedPost.createdAt;
                    let formattedDate = 'N/A';
                    try {
                      if (dateValue) {
                        const date = new Date(dateValue);
                        if (!isNaN(date.getTime())) {
                          formattedDate = date.toLocaleDateString();
                        }
                      }
                    } catch (error) {
                      logger.error('Date formatting error', error);
                    }
                    
                    return (
                      <Link
                        key={relatedPost.id || index}
                        href={`/blog/${relatedPost.slug}`}
                        className="block p-4 border border-border rounded-lg hover:bg-muted transition-colors h-full"
                      >
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                          <Calendar size={12} />
                          <span>{formattedDate}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <div className="mt-8">
            <CommentSection postId={post.id} />
          </div>
        </div>
      </div>

      {/* Enhanced SEO Schema.org JSON-LD with Breadcrumbs and Organization */}
      <Script id="blog-schema" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}#article`,
              headline: post.title,
              alternativeHeadline: post.seoTitle,
              description: post.seoDescription || post.excerpt,
              image: {
                '@type': 'ImageObject',
                url: post.featuredImage || post.ogImage || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/default-blog-image.jpg`,
                width: 1200,
                height: 630,
              },
              datePublished: post.publishedAt || post.createdAt,
              dateModified: post.updatedAt,
              author: {
                '@type': 'Person',
                '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/author/${post.author?.username}#person`,
                name: post.author?.displayName || post.author?.username || 'AI Editor',
                url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/author/${post.author?.username}`,
              },
              publisher: {
                '@type': 'Organization',
                '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}#organization`,
                name: 'Wall Painting Services',
                url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                logo: {
                  '@type': 'ImageObject',
                  url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`,
                  width: 600,
                  height: 60,
                },
                sameAs: [
                  'https://facebook.com/wallpaintingservices',
                  'https://twitter.com/wallpaintingservices',
                  'https://instagram.com/wallpaintingservices',
                  'https://linkedin.com/company/wallpaintingservices',
                ],
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`,
              },
              keywords: post.seoKeywords?.join(', '),
              articleSection: post.categories?.[0]?.name,
              articleBody: post.content.replace(/<[^>]*>/g, '').substring(0, 500) + '...',
              wordCount: post.content.split(/\\s+/).length,
              timeRequired: `PT${post.readingTime || 5}M`,
              inLanguage: 'en-US',
              copyrightYear: new Date(post.publishedAt || post.createdAt).getFullYear(),
              copyrightHolder: {
                '@type': 'Organization',
                name: 'Wall Painting Services',
              },
              commentCount: post._count?.comments || 0,
              interactionStatistic: [
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/ReadAction',
                  userInteractionCount: post.viewCount || 0,
                },
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/CommentAction',
                  userInteractionCount: post._count?.comments || 0,
                },
              ],
            },
            {
              '@type': 'BreadcrumbList',
              '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}#breadcrumb`,
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Blog',
                  item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: post.title,
                  item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`,
                },
              ],
            },
            {
              '@type': 'WebPage',
              '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}#webpage`,
              url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`,
              name: post.title,
              description: post.seoDescription || post.excerpt,
              isPartOf: {
                '@type': 'WebSite',
                '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}#website`,
                url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
                name: 'Wall Painting Services',
                publisher: {
                  '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}#organization`,
                },
              },
              primaryImageOfPage: {
                '@type': 'ImageObject',
                url: post.featuredImage || post.ogImage,
              },
              datePublished: post.publishedAt || post.createdAt,
              dateModified: post.updatedAt,
              breadcrumb: {
                '@id': `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}#breadcrumb`,
              },
              potentialAction: {
                '@type': 'ReadAction',
                target: [`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`],
              },
            },
          ],
        })}
      </Script>
    </div>
  );
}
