import { Suspense } from 'react';
import AuthPageClient from '@/app/auth/AuthPageClient';

type AuthPageSearchParams = {
  mode?: string;
  next?: string;
};

type AuthPageProps = {
  searchParams?: Promise<AuthPageSearchParams>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = searchParams ? await searchParams : {};
  const mode = params?.mode === 'signup' ? 'signup' : 'login';

  return (
    <Suspense
      fallback={(
        <div className="flex bg-background min-h-[80vh] items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
    >
      <AuthPageClient initialMode={mode} />
    </Suspense>
  );
}
