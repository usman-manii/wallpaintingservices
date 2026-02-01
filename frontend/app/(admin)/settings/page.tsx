'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Redirecting to settings...</div>
    </div>
  );
}
