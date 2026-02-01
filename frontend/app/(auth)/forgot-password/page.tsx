// frontend/app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetchAPI('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setStatus('success');
      setMessage(res.message);
      
      if (res.dev_token) {
          console.log('DEV ONLY: Reset Token', res.dev_token);
          // In dev, show it to help user
          setMessage(`${res.message} (DEV ONLY: Token=${res.dev_token})`);
      }

    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  }

  return (
    <div className="flex bg-background min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
           <p className="text-muted-foreground mt-2">Enter your email to receive instructions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`p-3 rounded-md text-sm mb-4 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {message}
              </div>
            )}

            {status !== 'success' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        className="pl-10" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={status === 'loading'}>
                    {status === 'loading' ? 'Sending Link...' : 'Send Reset Link'}
                </Button>
                </form>
            ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Check your email for the reset link.</p>
                  <Button variant="outline" className="w-full" onClick={() => setStatus('idle')}>
                      Try another email
                  </Button>
                </div>
            )}
            
            <div className="mt-4 text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4"/> Back to Login
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
