'use client';

import { Button } from '@/components/ui/Button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-6 text-center">
      <div className="max-w-xl space-y-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Dashboard Guard</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Something broke in the admin view</h1>
        <p className="text-slate-600 dark:text-slate-300">
          We stopped the auto-reload loop and kept your session. You can retry the last action or head back to a safe page.
        </p>
        <div className="bg-slate-100 dark:bg-slate-800/70 rounded-lg px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 font-mono break-words">
          {error?.message || 'Unknown error'}
          {error?.digest && (
            <div className="text-xs text-slate-500 mt-1">Ref: {error.digest}</div>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()}>Retry</Button>
          <Button variant="outline" onClick={() => { window.location.href = '/dashboard'; }}>
            Go to dashboard
          </Button>
          <Button variant="ghost" onClick={() => { window.location.href = '/auth'; }}>
            Sign in again
          </Button>
        </div>
      </div>
    </div>
  );
}
