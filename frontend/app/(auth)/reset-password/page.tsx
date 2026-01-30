// frontend/app/(auth)/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock } from 'lucide-react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
  
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
  
    if (!token) {
        return (
            <div className="text-center text-red-600">
                Invalid or missing reset token.
            </div>
        )
    }
  
    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      
      if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
      }
  
      setStatus('loading');
      setMessage('');
  
      try {
        await fetchAPI('/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: password }),
        });
  
        setStatus('success');
        setMessage('Password reset successfully. Redirecting to login...');
        
        setTimeout(() => {
            router.push('/login');
        }, 2000);
  
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Reset failed');
      } finally {
        if( status !== 'success') setStatus('error'); // keep error state if failed
      }
    }
    
    // helper to set error specifically
    const setError = (msg: string) => {
        setMessage(msg);
        setStatus('error');
    }

    return (
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Set New Password</CardTitle>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`p-3 rounded-md text-sm mb-4 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    type="password" 
                    placeholder="New password" 
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    type="password" 
                    placeholder="Confirm new password" 
                    className="pl-10" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={status === 'loading' || status === 'success'}>
                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
    );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex bg-slate-50 min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-slate-900">Secure Your Account</h1>
        </div>
        <Suspense fallback={<div>Loading form...</div>}>
            <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
