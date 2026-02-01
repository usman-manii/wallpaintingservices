'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  
  const [formData, setFormData] = useState({
    requestId: '',
    oldEmailCode: '',
    newEmailCode: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = searchParams.get('requestId');
    if (id) {
      setFormData(prev => ({ ...prev, requestId: id }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetchAPI('/auth/email-change/verify', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      success('Email changed successfully! Please log in with your new email.');
      router.push('/login');
    } catch (err: any) {
      showError(err.message || 'Verification failed. Please check your codes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verify Email Change</CardTitle>
        <CardDescription>
          Enter the verification codes sent to your old and new email addresses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="requestId" className="text-sm font-medium">Request ID</label>
            <Input
              id="requestId"
              name="requestId"
              placeholder="Request ID"
              value={formData.requestId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="oldEmailCode" className="text-sm font-medium">Old Email Code</label>
            <Input
              id="oldEmailCode"
              name="oldEmailCode"
              placeholder="Enter code from old email"
              value={formData.oldEmailCode}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="newEmailCode" className="text-sm font-medium">New Email Code</label>
            <Input
              id="newEmailCode"
              name="newEmailCode"
              placeholder="Enter code from new email"
              value={formData.newEmailCode}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading} isLoading={loading}>
            Verify Email Change
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-2">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
           <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
