'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
   const [idLabels, setIdLabels] = useState<Record<string, string>>({});

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }];

    let currentPath = '';
    paths.forEach((path, index) => {
      if (path === 'dashboard') return;
      
      currentPath += `/${path}`;
      let label =
        idLabels[path] ||
        path
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

      // Fallback: short descriptive ID
      if (!idLabels[path] && path.length > 16 && path.includes('-')) {
        label = `ID ${path.slice(0, 8)}…`;
      }

      breadcrumbs.push({
        label,
        href: index < paths.length - 1 ? currentPath : undefined,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const uuidRegex = useMemo(
    () => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    []
  );

  useEffect(() => {
    const paths = pathname.split('/').filter(Boolean);
    const idsToLookup = paths.filter(p => uuidRegex.test(p) && !idLabels[p]);
    if (!idsToLookup.length) return;

    idsToLookup.forEach(async (id) => {
      try {
        const data = await fetchAPI(`/pages/${id}`);
        const title = data?.title || data?.slug;
        if (!title) return;
        setIdLabels(prev => ({
          ...prev,
          [id]: `Page: ${title}`,
        }));
      } catch (err) {
        // keep silent; fallback label stays short ID
      }
    });
  }, [pathname, uuidRegex, idLabels]);

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />}
          {index === 0 && <Home className="w-4 h-4 mr-2" />}
          {crumb.href ? (
            <Link 
              href={crumb.href} 
              className="hover:text-primary transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
