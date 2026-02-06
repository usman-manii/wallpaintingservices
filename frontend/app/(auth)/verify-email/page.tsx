'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Loader2 } from 'lucide-react';
import logger from '@/lib/logger';
import { getErrorMessage } from '@/lib/error-utils';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();
  
  const [formData, setFormData] = useState({
    requestId: '',
    oldEmailCode: '',
    newEmailCode: ''
  });
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const codeAttemptRef = useRef(false);

  useEffect(() => {
    const id = searchParams.get('requestId');
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (id) {
      setFormData(prev => ({ ...prev, requestId: id }));
    }
    if (tokenParam) {
      setToken(tokenParam);
    }
    if (emailParam) {
      setVerificationEmail(emailParam);
    }
  }, []); // Only run once on mount

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVerifyCode = async (overrideCode?: string) => {
    if (verifyingCode) return;
    const code = (overrideCode ?? verificationCode).trim();
    if (!verificationEmail.trim()) {
      showError('Email is required to verify the code.');
      return;
    }
    if (code.length < 4) {
      showError('Please enter the verification code.');
      return;
    }

    setVerifyingCode(true);
    setCodeMessage('');
    codeAttemptRef.current = true;

    try {
      await fetchAPI('/auth/verify-email/code', {
        method: 'POST',
        body: JSON.stringify({ email: verificationEmail.trim(), code }),
      });
      success('Email verified successfully. You can continue to login.');
      setCodeMessage('Verification successful. Redirecting to login...');
      setTimeout(() => router.push('/auth?mode=login'), 1200);
    } catch (err: unknown) {
      logger.error('Email verification code failed', err, { component: 'VerifyEmailPage' });
      showError(getErrorMessage(err, 'Verification failed. Please check your code.'));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleTokenVerify = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await fetchAPI('/auth/verify-email/confirm', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      success('Email verified successfully. You can continue to login.');
      router.push('/auth?mode=login');
    } catch (err: unknown) {
      logger.error('Email verification failed', err, { component: 'VerifyEmailPage' });
      showError(getErrorMessage(err, 'Verification failed. Please check your link.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetchAPI('/auth/email-change/verify', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      success('Email changed successfully! Please log in with your new email.');
      router.push('/auth?mode=login');
    } catch (err: unknown) {
      logger.error('Email verification failed', err, { component: 'VerifyEmailPage' });
      showError(getErrorMessage(err, 'Verification failed. Please check your codes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    const trimmedCode = verificationCode.trim();
    if (trimmedCode.length < 6) {
      codeAttemptRef.current = false;
      return;
    }
    if (!verificationEmail.trim() || codeAttemptRef.current) return;
    handleVerifyCode(trimmedCode);
  }, [verificationCode, verificationEmail, token]);

  if (token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your email or verify with the link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="verificationEmail" className="text-sm font-medium">Email</label>
              <Input
                id="verificationEmail"
                type="email"
                placeholder="you@example.com"
                value={verificationEmail}
                autoComplete="email"
                onChange={(e) => setVerificationEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="verificationCode" className="text-sm font-medium">Verification Code</label>
              <Input
                id="verificationCode"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                maxLength={6}
                autoComplete="one-time-code"
                onChange={(e) => {
                  const value = e.target.value.replace(/\\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                We sent a 6-digit verification code to your inbox.
              </p>
            </div>
            {codeMessage && (
              <p className="text-xs text-emerald-600">{codeMessage}</p>
            )}
            <Button
              type="button"
              className="w-full"
              onClick={() => handleVerifyCode()}
              disabled={verifyingCode}
              isLoading={verifyingCode}
            >
              Verify Code
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>or</span>
              <Button
                type="button"
                variant="outline"
                onClick={handleTokenVerify}
                disabled={loading}
              >
                Verify with link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verify Email Change</CardTitle>
        <CardDescription>
          Enter the verification codes sent to your old and new email addresses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleEmailChangeSubmit} className="space-y-4">
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


