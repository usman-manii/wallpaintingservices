import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';

async function getPosts() {
  try {
    const res = await fetch(`${API_URL}/blog?status=PUBLISHED&take=1000`, {
      next: { revalidate: 3600 },
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/blog/categories`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getTags() {
  try {
    const res = await fetch(`${API_URL}/blog/tags`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getPages() {
  try {
    const res = await fetch(`${API_URL}/pages/public`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const posts = await getPosts();
  const categories = await getCategories();
  const tags = await getTags();
  const pages = await getPages();

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Blog posts
  const postUrls: MetadataRoute.Sitemap = posts.map((post: any) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Categories
  const categoryUrls: MetadataRoute.Sitemap = categories.map((category: any) => ({
    url: `${siteUrl}/blog/category/${category.slug}`,
    lastModified: new Date(category.updatedAt || category.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Tags
  const tagUrls: MetadataRoute.Sitemap = tags.map((tag: any) => ({
    url: `${siteUrl}/blog/tag/${tag.slug}`,
    lastModified: new Date(tag.updatedAt || tag.createdAt),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  // Pages (published only, exclude homepage)
  const pageUrls: MetadataRoute.Sitemap = pages
    .filter((page: any) => page.slug !== '(home)')
    .map((page: any) => ({
      url: `${siteUrl}/${page.slug}`,
      lastModified: new Date(page.updatedAt || page.publishedAt || page.createdAt),
      changeFrequency: 'monthly' as const,
      priority: page.pageType === 'HOMEPAGE' || page.pageType === 'LANDING' ? 0.9 : 0.7,
    }));

  return [...routes, ...postUrls, ...categoryUrls, ...tagUrls, ...pageUrls];
}
