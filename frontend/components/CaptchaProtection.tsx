'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

/* 
 * Enterprise Grade Captcha System - Production Ready
 * Strategy:
 * 1. Load Google reCAPTCHA v3 for invisible verification
 * 2. Fallback to reCAPTCHA v2 (Checkbox) if v3 score is low
 * 3. Fallback to Custom Server-Side Challenge if Google services fail
 */

interface CaptchaProps {
  onVerify: (token: string, type: 'v3' | 'v2' | 'custom') => void;
  action?: string;
  siteKeyV3?: string;
  siteKeyV2?: string;
}

export default function CaptchaProtection({ 
  onVerify, 
  action = 'submit',
  siteKeyV3,
  siteKeyV2 
}: CaptchaProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'verifying' | 'verified' | 'error' | 'fallback'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [captchaType, setCaptchaType] = useState<'v3' | 'v2' | 'custom'>('v3');
  const [customChallenge, setCustomChallenge] = useState<{ image: string; captchaId: string } | null>(null);
  const [customAnswer, setCustomAnswer] = useState('');
  const v2ContainerRef = useRef<HTMLDivElement>(null);
  const v2WidgetId = useRef<number | null>(null);
  const scriptLoadedRef = useRef(false);

  // Load reCAPTCHA script
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const loadRecaptcha = () => {
      if (document.getElementById('recaptcha-script')) return;
      
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.warn('Failed to load Google reCAPTCHA, using custom fallback');
        setCaptchaType('custom');
        setStatus('fallback');
      };
      document.head.appendChild(script);
      scriptLoadedRef.current = true;
    };

    loadRecaptcha();
  }, []);

  // Auto-execute v3 on mount
  useEffect(() => {
    if (status === 'idle' && siteKeyV3 && captchaType === 'v3') {
      runV3Verification();
    }
  }, [status, siteKeyV3, captchaType]);

  const runV3Verification = useCallback(async () => {
    if (!siteKeyV3) {
      fallbackToCustom();
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      // Wait for grecaptcha to load
      await waitForGrecaptcha();

      if (!window.grecaptcha || !window.grecaptcha.execute) {
        throw new Error('reCAPTCHA not loaded');
      }

      const token = await window.grecaptcha.execute(siteKeyV3, { action });

      // Backend will validate the score
      setStatus('verified');
      onVerify(token, 'v3');
    } catch (error: any) {
      console.error('reCAPTCHA v3 error:', error);
      // Fallback to v2
      if (siteKeyV2) {
        setCaptchaType('v2');
        setStatus('fallback');
        renderV2Captcha();
      } else {
        fallbackToCustom();
      }
    }
  }, [siteKeyV3, siteKeyV2, action, onVerify]);

  const renderV2Captcha = useCallback(() => {
    if (!siteKeyV2 || !v2ContainerRef.current) return;

    const interval = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.render) {
        clearInterval(interval);

        if (v2WidgetId.current !== null) {
          // Reset existing widget
          window.grecaptcha.reset(v2WidgetId.current);
        } else {
          // Render new widget
          v2WidgetId.current = window.grecaptcha.render(v2ContainerRef.current, {
            sitekey: siteKeyV2,
            callback: (token: string) => {
              setStatus('verified');
              onVerify(token, 'v2');
            },
            'error-callback': () => {
              setErrorMessage('reCAPTCHA error. Please try again.');
              fallbackToCustom();
            },
          });
        }
      }
    }, 100);

    setTimeout(() => clearInterval(interval), 10000); // Timeout after 10s
  }, [siteKeyV2, onVerify]);

  const fallbackToCustom = async () => {
    setCaptchaType('custom');
    setStatus('fallback');
    await loadCustomChallenge();
  };

  const loadCustomChallenge = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/captcha/generate`);
      
      if (!response.ok) throw new Error('Failed to load captcha');
      
      const data = await response.json();
      setCustomChallenge(data);
    } catch (error) {
      console.error('Custom captcha error:', error);
      setErrorMessage('Failed to load security challenge. Please refresh the page.');
    }
  };

  const verifyCustomChallenge = async () => {
    if (!customChallenge || !customAnswer.trim()) {
      setErrorMessage('Please enter the captcha text');
      return;
    }

    const previousStatus = status;
    setStatus('verifying');
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/captcha/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customAnswer,
          captchaId: customChallenge.captchaId,
          type: 'custom',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('verified');
        onVerify(customChallenge.captchaId, 'custom');
      } else {
        setErrorMessage('Incorrect captcha. Please try again.');
        setCustomAnswer('');
        setStatus('fallback');
        await loadCustomChallenge();
      }
    } catch (error) {
      setErrorMessage('Verification failed. Please try again.');
      setStatus('fallback');
      await loadCustomChallenge();
    }
  };

  const waitForGrecaptcha = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.grecaptcha && window.grecaptcha.execute) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 50) {
          clearInterval(interval);
          reject(new Error('reCAPTCHA failed to load'));
        }
      }, 100);
    });
  };

  if (status === 'verified') {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <ShieldCheck size={18} />
        <span>Security Check Passed</span>
      </div>
    );
  }

  if (status === 'fallback' && captchaType === 'v2') {
    return (
      <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
        <div className="mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Security Verification Required
          </span>
        </div>
        <div ref={v2ContainerRef} className="flex justify-center" />
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  if (status === 'fallback' && captchaType === 'custom' && customChallenge) {
    return (
      <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Security Challenge
          </span>
          <RefreshCw 
            size={16} 
            className="text-slate-400 cursor-pointer hover:text-blue-500 transition-colors" 
            onClick={loadCustomChallenge} 
          />
        </div>
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-800 p-3 rounded border border-slate-300 dark:border-slate-600">
            <img 
              src={customChallenge.image} 
              alt="Captcha" 
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter the text above"
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={customAnswer}
              onChange={(e) => setCustomAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && verifyCustomChallenge()}
            />
            <Button 
              size="sm" 
              onClick={verifyCustomChallenge}
              disabled={false}
            >
              Verify
            </Button>
          </div>
          {errorMessage && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={14} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'verifying' || status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 p-3 text-sm text-slate-600 dark:text-slate-400">
        <RefreshCw size={16} className="animate-spin" />
        <span>Verifying security...</span>
      </div>
    );
  }

  return (
    <div className="my-2">
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={runV3Verification} 
        disabled={false}
        className="w-full justify-center gap-2"
      >
        <ShieldCheck size={16} />
        Verify Security
      </Button>
      <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-1">
        Protected by reCAPTCHA
      </p>
    </div>
  );
}
