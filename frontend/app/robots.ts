// frontend/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/blog/', '/contact'],
        disallow: ['/dashboard', '/dashboard/', '/login', '/register', '/auth', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/blog', '/blog/', '/contact'],
        disallow: ['/dashboard', '/dashboard/', '/login', '/register', '/auth', '/api/'],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/blog', '/blog/', '/contact'],
        disallow: ['/dashboard', '/dashboard/', '/login', '/register', '/auth', '/api/'],
        crawlDelay: 1,
      },
    ],
    sitemap: [
      `${siteUrl}/sitemap-index.xml`,
      `${siteUrl}/sitemap.xml`,
      `${siteUrl}/sitemap-blog.xml`,
    ],
    host: siteUrl,
  };
}
