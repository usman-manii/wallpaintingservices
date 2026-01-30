'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactInfoRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/settings/contact-info');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-500">Redirecting to contact info...</div>
    </div>
  );
}
