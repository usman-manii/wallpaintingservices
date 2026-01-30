// frontend/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Mail } from 'lucide-react';
import { Captcha } from '@/components/auth/Captcha';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaType, setCaptchaType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const captchaRequired = process.env.NODE_ENV === 'production';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (captchaRequired && !captchaToken) {
       setError('Please complete the security check');
       return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken, captchaId, captchaType }),
      });

      if (data?.user?.role) {
        localStorage.setItem('user_role', data.user.role);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-slate-900">Welcome Back</h1>
           <p className="text-slate-500 mt-2">Sign in to manage your AI content empire</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="py-2">
                 <Captcha onVerify={(token, id, type) => { 
                    setCaptchaToken(token); 
                    setCaptchaId(id || ''); 
                    setCaptchaType(type || 'recaptcha-v2');
                 }} />
              </div>

              <Button type="submit" className="w-full" isLoading={loading}>
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
