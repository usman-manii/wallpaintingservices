// frontend/app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CommentSection from '@/components/CommentSection';
import ShareButtons from '@/components/ShareButtons';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Calendar, User, Clock, Eye } from 'lucide-react';
import { API_URL } from '@/lib/api';

export const revalidate = 300; // 5 mins

async function getPost(slug: string) {
  try {
    const res = await fetch(`${API_URL}/blog/${slug}`, {
       next: { revalidate: 300 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

async function getRelatedPosts(postId: string) {
  try {
    const res = await fetch(`${API_URL}/blog/${postId}/related`, {
      next: { revalidate: 600 }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
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
      tags: post.tags?.map((t: any) => t.name) || [],
      section: post.categories?.[0]?.name,
    },
    twitter: {
      card: post.twitterCard || 'summary_large_image',
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
    other: {
      'article:published_time': post.publishedAt,
      'article:modified_time': post.updatedAt,
      'article:author': post.author?.displayName || post.author?.username,
      'article:section': post.categories?.[0]?.name || 'Blog',
      'article:tag': post.tags?.map((t: any) => t.name).join(',') || '',
    },
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  
  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post.id);

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-20">
      {/* Hero Header with Featured Image */}
      <div className="bg-slate-900 text-white py-20 px-4 relative overflow-hidden">
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
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 mb-8 pl-0">
              <ArrowLeft size={16} className="mr-2" /> Back to Blog
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">{post.title}</h1>
          <div className="flex flex-wrap gap-6 text-slate-300 text-sm">
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
              <span className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                🤖 AI-Enhanced
              </span>
            )}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((tag: any) => (
                <Link
                  key={tag.id}
                  href={`/blog?tag=${tag.slug}`}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-20">
        <div className="space-y-8">
          {/* Main Content */}
          <article className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 md:p-12">
            <div 
              className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-12"
              // SECURITY NOTE: Content is sanitized on backend using SanitizationUtil.sanitizeHTML()
              // which removes script tags, event handlers, and dangerous protocols
              dangerouslySetInnerHTML={{ __html: post.content }} 
            />

            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mt-8">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/blog?category=${cat.slug}`}
                      className="text-sm bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-lg transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-700 pt-8 mt-8">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">Share this post</h4>
              <ShareButtons title={post.title} />
            </div>
          </article>
          
          {/* Related Posts - 4 Column Horizontal Layout */}
          {relatedPosts && relatedPosts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {relatedPosts.map((relatedPost: any, index: number) => {
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
                    } catch (e) {
                      console.error('Date formatting error:', e);
                    }
                    
                    return (
                      <Link
                        key={relatedPost.id || index}
                        href={`/blog/${relatedPost.slug}`}
                        className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors h-full"
                      >
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-auto">
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
                    userInteractionCount: post.views || 0,
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
          }),
        }}
      />
    </div>
  );
}
