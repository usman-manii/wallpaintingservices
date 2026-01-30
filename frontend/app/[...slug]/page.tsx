import DynamicPageRenderer from '@/components/DynamicPageRenderer';
import { use } from 'react';
import { notFound } from 'next/navigation';

// Admin routes that should not be processed as dynamic pages
const ADMIN_ROUTE_PREFIXES = [
  'dashboard',
  'auth',
  'login',
  'admin',
  'api',
  '_next',
  'static',
  'settings' // Settings route redirects to /dashboard/settings
];

export default function DynamicPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);
  const slugPath = slug.join('/');
  
  // Exclude admin routes from dynamic page rendering
  const isAdminRoute = ADMIN_ROUTE_PREFIXES.some(prefix => 
    slugPath.startsWith(prefix + '/') || slugPath === prefix
  );
  
  if (isAdminRoute) {
    notFound();
    return null;
  }
  
  return <DynamicPageRenderer slug={slugPath} />;
}
