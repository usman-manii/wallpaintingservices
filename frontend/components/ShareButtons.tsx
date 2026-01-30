'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';

export default function ShareButtons({ title }: { title: string }) {
  const [shareUrl, setShareUrl] = useState<string>('');

  // Ensure server and client initial HTML match: start with empty hrefs,
  // then fill in the real URL only after hydration.
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        setShareUrl(window.location.href);
      }
    } catch {
      setShareUrl('');
    }
  }, []);

  const baseUrl =
    typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      : shareUrl || window.location.href;

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(baseUrl);

  const shareLinks = [
    {
      name: 'Twitter',
      url: shareUrl
        ? `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
        : '#',
    },
    {
      name: 'Facebook',
      url: shareUrl
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        : '#',
    },
    {
      name: 'LinkedIn',
      url: shareUrl
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        : '#',
    },
  ];

  return (
    <div className="flex gap-4">
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm text-gray-700 font-medium"
        >
          {link.name}
        </a>
      ))}
    </div>
  );
}
