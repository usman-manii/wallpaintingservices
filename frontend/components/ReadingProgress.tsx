'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress({ targetId = 'post-content' }: { targetId?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handler = () => {
      const target = document.getElementById(targetId);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const total = target.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY - target.offsetTop;
      const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0;
      setProgress(pct);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [targetId]);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
      <div
        className="h-1 bg-primary transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
