// frontend/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Mail, User } from 'lucide-react';
import { Captcha } from '@/components/auth/Captcha';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaType, setCaptchaType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    
    if (!captchaToken) {
        setError('Please complete the security check.');
        return;
    }

    setLoading(true);
    setError('');

    try {
      await fetchAPI('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, captchaToken, captchaId, captchaType }),
      });

      // Redirect to login or auto-login
      router.push('/login?message=Account created. Please login.');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
           <p className="text-slate-500 mt-2">Join to manage your AI content</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="John Doe" 
                    className="pl-10" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="py-2">
                 <Captcha onVerify={(token, id, type) => { 
                    setCaptchaToken(token); 
                    setCaptchaId(id || ''); 
                    setCaptchaType(type || 'recaptcha-v2');
                 }} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm">
                Already have an account? {' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                    Login here
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
