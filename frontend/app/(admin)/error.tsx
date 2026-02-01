'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-xl space-y-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Dashboard Guard</p>
        <h1 className="text-3xl font-bold text-foreground">Something broke in the admin view</h1>
        <p className="text-muted-foreground">
          We stopped the auto-reload loop and kept your session. You can retry the last action or head back to a safe page.
        </p>
        <div className="bg-muted rounded-lg px-4 py-3 text-left text-sm text-foreground font-mono break-words">
          {error?.message || 'Unknown error'}
          {error?.digest && (
            <div className="text-xs text-muted-foreground mt-1">Ref: {error.digest}</div>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()}>Retry</Button>
          <Button variant="outline" onClick={() => { router.replace('/dashboard'); }}>
            Go to dashboard
          </Button>
          <Button variant="ghost" onClick={() => { router.replace('/auth'); }}>
            Sign in again
          </Button>
        </div>
      </div>
    </div>
  );
}
