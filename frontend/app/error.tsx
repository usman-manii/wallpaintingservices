'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global error', error, { component: 'GlobalError' });
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-xl p-6 space-y-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Application Guard</p>
          <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            We paused the page instead of auto-refreshing. You can retry or jump to a safe page.
          </p>
          {error?.message && (
            <div className="bg-muted rounded px-4 py-3 text-left text-sm font-mono text-foreground break-words">
              {error.message}
              {error?.digest && (
                <div className="text-xs text-muted-foreground mt-1">Ref: {error.digest}</div>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => reset()} ariaLabel="Retry loading the page">Retry</Button>
            <Link href="/" className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm px-2 py-1">
              Go home
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm px-2 py-1">
              Sign in
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
