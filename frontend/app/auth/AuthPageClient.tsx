'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Mail, User } from 'lucide-react';
import { Captcha } from '@/components/auth/Captcha';
import { useUserSession } from '@/contexts/UserSessionContext';
import { finalizeAuthSuccess, loginUser, registerUser, resolvePostAuthDestination } from '@/lib/authClient';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/error-utils';
import PasswordRules from '@/components/auth/PasswordRules';
import { getPasswordValidationMessage } from '@/lib/passwordRules';

type Mode = 'login' | 'signup';

type AuthPageClientProps = {
  initialMode?: Mode;
};

export default function AuthPageClient({ initialMode }: AuthPageClientProps) {
  const router = useRouter();
  const { refreshSession, role, loading: sessionLoading } = useUserSession();
  const searchParams = useSearchParams();
  const resolvedInitialMode = initialMode ?? ((searchParams?.get('mode') === 'signup' ? 'signup' : 'login') as Mode);
  const nextParam = searchParams?.get('next');
  const [mode, setMode] = useState<Mode>(resolvedInitialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [captchaData, setCaptchaData] = useState<{ token: string; captchaId?: string; type?: string } | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const captchaRequired = process.env.NODE_ENV === 'production';

  useEffect(() => {
    if (initialMode) return;
    const modeFromUrl = searchParams?.get('mode');
    if (modeFromUrl === 'login' || modeFromUrl === 'signup') {
      setMode(modeFromUrl);
    }
  }, []); // Only run once on mount - searchParams is read from initial value

  useEffect(() => {
    if (sessionLoading || !role) return;
    const destination = resolvePostAuthDestination(role, nextParam);
    router.replace(destination);
  }, [role, sessionLoading, nextParam, router]);

  const resetCaptcha = () => {
    setCaptchaVerified(false);
    setCaptchaData(null);
    setCaptchaKey((prev) => prev + 1);
  };

  const handleCaptchaVerify = (token: string, captchaId?: string, type?: string) => {
    const isVerified = !!token;
    setCaptchaVerified(isVerified);
    if (isVerified) {
      setCaptchaData({ token, captchaId, type });
    } else {
      setCaptchaData(null);
    }
  };

  const switchMode = () => {
    const nextMode = mode === 'login' ? 'signup' : 'login';
    setMode(nextMode);
    setError('');
    resetCaptcha();
    router.push(`/auth?mode=${nextMode}${nextParam ? `&next=${encodeURIComponent(nextParam)}` : ''}`);
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (captchaRequired && !captchaData?.token) {
      setError('Please complete the security check');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const captchaPayload = captchaData?.token
        ? {
            captchaToken: captchaData.token,
            captchaId: captchaData.captchaId,
            captchaType: captchaData.type,
          }
        : {};

      const user = await loginUser({
        email,
        password,
        ...captchaPayload,
      });

      await finalizeAuthSuccess({
        user,
        refreshSession,
        router,
        next: nextParam,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid email or password'));
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (captchaRequired && !captchaData?.token) {
      setError('Please complete the security check');
      return;
    }

    const passwordError = getPasswordValidationMessage(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const captchaPayload = captchaData?.token
        ? {
            captchaToken: captchaData.token,
            captchaId: captchaData.captchaId,
            captchaType: captchaData.type,
          }
        : {};

      const user = await registerUser({
        email,
        password,
        username,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        ...captchaPayload,
      });

      await finalizeAuthSuccess({
        user,
        refreshSession,
        router,
        next: nextParam,
      });
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Registration failed');
      if (errorMsg.includes('already exists') || errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
        setError('An account with this email or username already exists.');
      } else {
        setError(errorMsg);
      }
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = mode === 'login' ? handleLogin : handleRegister;

  const passwordErrorMessage = getPasswordValidationMessage(password);

  return (
    <div className="flex bg-background min-h-[80vh] items-center justify-center py-8">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'login'
              ? 'Sign in to manage your content'
              : 'Join us to start managing your content'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="First name"
                        className="pl-10"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Last name"
                        className="pl-10"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Username"
                      className="pl-10"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="********"
                  className="pl-10"
                  required
                  minLength={12}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <PasswordRules password={password} />
              {mode === 'signup' && passwordErrorMessage && (
                <p className="text-xs text-red-600">{passwordErrorMessage}</p>
              )}

              {mode === 'login' && (
                <div className="text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <div className="py-2">
                <Captcha
                  key={captchaKey}
                  onVerify={handleCaptchaVerify}
                />
              </div>

              <Button type="submit" className="w-full" isLoading={loading}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-primary hover:text-primary/80 font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-primary hover:text-primary/80 font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <Link
                href="/forgot-password"
                className="text-center border border-border rounded-lg py-2 hover:border-primary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Forgot password
              </Link>
              <Link
                href="/reset-password"
                className="text-center border border-border rounded-lg py-2 hover:border-primary hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Reset with token
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


