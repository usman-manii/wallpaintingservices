import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/api';

type SitemapPost = {
  slug: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
};

type SitemapCategory = {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
};

type SitemapTag = {
  slug: string;
  updatedAt?: string;
  createdAt?: string;
};

type SitemapPage = {
  slug: string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
  pageType?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const normalizeList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) {
    const candidates = ['data', 'items', 'results', 'pages', 'posts', 'categories', 'tags'];
    for (const key of candidates) {
      const possible = value[key];
      if (Array.isArray(possible)) return possible;
    }
  }
  return [];
};

const toPost = (value: unknown): SitemapPost | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.slug !== 'string') return null;
  return {
    slug: obj.slug,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt : undefined,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
  };
};

const toCategory = (value: unknown): SitemapCategory | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.slug !== 'string') return null;
  return {
    slug: obj.slug,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
  };
};

const toTag = (value: unknown): SitemapTag | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.slug !== 'string') return null;
  return {
    slug: obj.slug,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
  };
};

const toPage = (value: unknown): SitemapPage | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.slug !== 'string') return null;
  return {
    slug: obj.slug,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    publishedAt: typeof obj.publishedAt === 'string' ? obj.publishedAt : undefined,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : undefined,
    pageType: typeof obj.pageType === 'string' ? obj.pageType : undefined,
  };
};

async function getPosts(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_URL}/blog?status=PUBLISHED&take=1000`, {
      next: { revalidate: 3600 },
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
    if (!res.ok) return [];
    return normalizeList(await res.json());
  } catch {
    return [];
  }
}

async function getCategories(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_URL}/blog/categories`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return normalizeList(await res.json());
  } catch {
    return [];
  }
}

async function getTags(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_URL}/blog/tags`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return normalizeList(await res.json());
  } catch {
    return [];
  }
}

async function getPages(): Promise<unknown[]> {
  try {
    const res = await fetch(`${API_URL}/pages/public`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    return normalizeList(await res.json());
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const posts = (await getPosts()).map(toPost).filter((post): post is SitemapPost => post !== null);
  const categories = (await getCategories()).map(toCategory).filter((category): category is SitemapCategory => category !== null);
  const tags = (await getTags()).map(toTag).filter((tag): tag is SitemapTag => tag !== null);
  const pages = (await getPages()).map(toPage).filter((page): page is SitemapPage => page !== null);

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
  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Categories
  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/blog/category/${category.slug}`,
    lastModified: new Date(category.updatedAt || category.createdAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Tags
  const tagUrls: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${siteUrl}/blog/tag/${tag.slug}`,
    lastModified: new Date(tag.updatedAt || tag.createdAt || Date.now()),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  // Pages (published only, exclude homepage)
  const pageUrls: MetadataRoute.Sitemap = pages
    .filter((page) => page.slug !== '(home)')
    .map((page) => ({
      url: `${siteUrl}/${page.slug}`,
      lastModified: new Date(page.updatedAt || page.publishedAt || page.createdAt || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: page.pageType === 'HOMEPAGE' || page.pageType === 'LANDING' ? 0.9 : 0.7,
    }));

  return [...routes, ...postUrls, ...categoryUrls, ...tagUrls, ...pageUrls];
}
