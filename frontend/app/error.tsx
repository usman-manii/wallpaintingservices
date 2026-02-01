'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="max-w-xl p-6 space-y-4 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Application Guard</p>
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-slate-600">
            We paused the page instead of auto-refreshing. You can retry or jump to a safe page.
          </p>
          <div className="bg-slate-100 rounded px-4 py-3 text-left text-sm font-mono text-slate-700 break-words">
            {error?.message || 'Unknown error'}
            {error?.digest && <div className="text-xs text-slate-500 mt-1">Ref: {error.digest}</div>}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => reset()}>Retry</Button>
            <Link href="/" className="text-blue-600 hover:underline">
              Go home
            </Link>
            <Link href="/auth" className="text-slate-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
