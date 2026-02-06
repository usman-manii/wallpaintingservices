import { Suspense } from 'react';
import AuthPageClient from '@/app/auth/AuthPageClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={(
        <div className="flex bg-background min-h-[80vh] items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
    >
      <AuthPageClient initialMode="login" />
    </Suspense>
  );
}
