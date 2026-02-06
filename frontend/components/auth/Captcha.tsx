'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePublicSettings } from '@/contexts/SettingsContext';
import { CAPTCHA_TYPE, CaptchaType as CaptchaTypeEnum, API_ROUTES } from '@/lib/constants';
import { api } from '@/lib/api';
import logger from '@/lib/logger';

export type CaptchaType = CaptchaTypeEnum;

export interface CaptchaProps {
  onVerify: (token: string, captchaId?: string, type?: string) => void;
  type?: CaptchaType;
}

export function Captcha({ onVerify, type }: CaptchaProps) {
  const { settings } = usePublicSettings();
  const [currentMethod, setCurrentMethod] = useState<CaptchaType | null>(type || null);
  const [fallbackChain, setFallbackChain] = useState<CaptchaType[]>([]);
  const [attemptedMethods, setAttemptedMethods] = useState<Set<CaptchaType>>(new Set());

  useEffect(() => {
     if (type) {
         setCurrentMethod(type);
     }
  }, [type]);

  useEffect(() => {
    if (!settings) return;
    
    if (!type) {
      // Build smart fallback chain based on available keys
      const chain: CaptchaType[] = [];
      
      // Primary: Use configured type
      const primary = (settings.captchaType as CaptchaType) || CAPTCHA_TYPE.RECAPTCHA_V2;
      chain.push(primary);
      
      // Fallback cascade: V3 to V2 to Custom
      if (primary !== CAPTCHA_TYPE.RECAPTCHA_V3 && settings.recaptchaV3SiteKey) {
        chain.push(CAPTCHA_TYPE.RECAPTCHA_V3);
      }
      if (primary !== CAPTCHA_TYPE.RECAPTCHA_V2 && (settings.recaptchaV2SiteKey || settings.recaptchaSiteKey)) {
        chain.push(CAPTCHA_TYPE.RECAPTCHA_V2);
      }
      if (primary !== CAPTCHA_TYPE.CUSTOM) {
        chain.push(CAPTCHA_TYPE.CUSTOM);
      }
      
      setFallbackChain(chain);
      setCurrentMethod(chain[0]);
    }
  }, [settings, type]);

  const handleFallback = useCallback(() => {
      if (!currentMethod) return;
      
      logger.warn('Captcha fallback triggered', { component: 'Captcha', currentMethod });
      
      // Mark current method as attempted
      setAttemptedMethods((prev) => {
        const next = new Set<CaptchaType>();
        prev.forEach((method) => next.add(method));
        next.add(currentMethod);
        return next;
      });
      
      // Find next method in fallback chain that hasn't been attempted
      const nextMethod = fallbackChain.find(method => 
        method !== currentMethod && !attemptedMethods.has(method)
      );
      
      if (nextMethod) {
        logger.info('Switching captcha method', { component: 'Captcha', nextMethod });
        setCurrentMethod(nextMethod);
      } else {
        logger.error('Captcha methods exhausted, falling back to custom', undefined, { component: 'Captcha' });
        setCurrentMethod(CAPTCHA_TYPE.CUSTOM);
      }
  }, [currentMethod, fallbackChain, attemptedMethods]);

  // Track if we're in fallback mode (attempted other methods)
  const isInFallbackMode = attemptedMethods.size > 0 && currentMethod === CAPTCHA_TYPE.CUSTOM;

  if (!settings || !currentMethod) return <div className="h-12 w-full bg-muted animate-pulse rounded-md" />;

  return (
    <div className="min-h-[50px] transition-all">
       {isInFallbackMode && (
           <div className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
               <AlertTriangle size={12} />
               <span>Security check service unavailable. Switched to internal verification.</span>
           </div>
       )}

       {currentMethod === 'recaptcha-v3' && (
          <RecaptchaV3 
            siteKey={settings.recaptchaV3SiteKey ?? undefined} 
            onVerify={(t) => onVerify(t, undefined, 'recaptcha-v3')} 
            onError={handleFallback}
          />
       )}
       
       {currentMethod === 'recaptcha-v2' && (
          <RecaptchaV2 
            siteKey={(settings.recaptchaV2SiteKey || settings.recaptchaSiteKey) as string | undefined} 
            onVerify={(t) => onVerify(t, undefined, 'recaptcha-v2')} 
            onError={handleFallback}
          />
       )}

       {currentMethod === 'custom' && (
          <CustomCaptcha 
            onVerify={(t, id) => onVerify(t, id, 'custom')} 
          />
       )}
    </div>
  );
}

// reCAPTCHA v2 Component
function RecaptchaV2({ onVerify, onError, siteKey }: { onVerify: (token: string) => void; onError: () => void; siteKey?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptId = 'recaptcha-v2-script';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!siteKey) { onError(); return; }

    const handleError = () => {
      logger.error('Recaptcha V2 script error', undefined, { component: 'Captcha' });
      onError();
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onerror = handleError;
      document.head.appendChild(script);
      
      script.onload = () => setIsLoaded(true);
      
      // Timeout fallback (3 seconds)
      setTimeout(() => {
          if (!window.grecaptcha) handleError();
      }, 5000);
    } else {
      setIsLoaded(true);
    }
  }, [siteKey, onError]);

  useEffect(() => {
    if (isLoaded && containerRef.current && window.grecaptcha && siteKey) {
      try {
        const grecaptcha = window.grecaptcha;
        const ready = grecaptcha?.ready;
        const render = grecaptcha?.render;
        if (!ready || !render) return;
        ready(() => {
          try {
            render(containerRef.current!, {
              sitekey: siteKey,
              callback: onVerify,
              'error-callback': onError,
              theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
            });
          } catch (e) {
            logger.error('Recaptcha V2 render exception', e, { component: 'Captcha' });
            onError();
          }
        });
      } catch (e) {
        logger.error('Recaptcha V2 setup error', e, { component: 'Captcha' });
        onError();
      }
    }
  }, [isLoaded, onVerify, onError, siteKey]);

  return (
    <div className="flex justify-center my-4">
      <div ref={containerRef} />
    </div>
  );
}

// reCAPTCHA v3 Component (Invisible)
function RecaptchaV3({ onVerify, onError, siteKey }: { onVerify: (token: string) => void; onError: () => void; siteKey?: string }) {
  const scriptId = 'recaptcha-v3-script';
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!siteKey) { onError(); return; }

    const handleError = () => onError();

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      script.onerror = handleError;
      document.head.appendChild(script);
      
      script.onload = () => {
          executeV3();
      };
      
      // Timeout 
      setTimeout(() => {
          if (!window.grecaptcha) onError();
      }, 5000);
    } else {
      executeV3();
    }

    function executeV3() {
        const grecaptcha = window.grecaptcha;
        const ready = grecaptcha?.ready;
        const execute = grecaptcha?.execute;
        if (!ready || !execute) return;
        ready(() => {
          execute(siteKey!, { action: 'submit' }).then((token: string) => {
            onVerify(token);
          }).catch((err: unknown) => {
            logger.error('Recaptcha V3 execution error', err, { component: 'Captcha' });
            onError();
          });
        });
    }
  }, [siteKey, onError, onVerify]);

  return <div className="hidden" />; // Invisible
}

function CustomCaptcha({ onVerify }: { onVerify: (token: string, id: string) => void }) {
    const [challenge, setChallenge] = useState<{image: string, captchaId: string} | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);

    const loadChallenge = async () => {
        setLoading(true);
        setVerified(false);
        try {
            const data = await api(API_ROUTES.CAPTCHA.CHALLENGE);
            const payload = data && typeof data === 'object'
              ? {
                  image: typeof (data as { image?: unknown }).image === 'string' ? (data as { image: string }).image : '',
                  captchaId: typeof (data as { captchaId?: unknown }).captchaId === 'string' ? (data as { captchaId: string }).captchaId : '',
                }
              : { image: '', captchaId: '' };
            if (payload.image && payload.captchaId) {
                setChallenge(payload);
                setInput('');
                // Reset parent token to ensure invalid state until typed
                onVerify('', '');
            } else {
                logger.error('Invalid captcha challenge response', data, { component: 'Captcha' });
            }
        } catch (e: unknown) {
            logger.error('Failed to load captcha challenge', e, { component: 'Captcha' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadChallenge(); }, []);

    const handleChange = (val: string) => {
        // Enforce alphanumeric and upper case for better UX
        const cleanVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setInput(cleanVal);
        
        if (cleanVal.length === 4 && challenge) {
            setVerified(true);
            onVerify(cleanVal, challenge.captchaId);
        } else {
             // Clear token if user modifies input to be invalid
            setVerified(false);
            onVerify('', ''); 
        }
    };

    if (!challenge) return (
        <div className="h-16 w-full bg-muted animate-pulse rounded border border-border flex items-center justify-center text-xs text-muted-foreground">
            {loading ? 'Loading Security Check...' : 'Security Service Unavailable'}
        </div>
    );

    return (
        <div className="border p-3 rounded-lg bg-muted border-border space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Security Check</span>
                    {verified && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <ShieldCheck size={14} />
                            Verified
                        </span>
                    )}
                </div>
                <button 
                    type="button" 
                    onClick={loadChallenge} 
                    className="text-primary hover:text-primary/80 p-1 rounded-full hover:bg-muted-foreground/10 transition-colors" 
                    title="Refresh Captcha"
                    disabled={loading}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="flex gap-3">
                <div className="relative h-12 w-32 bg-card rounded border border-border overflow-hidden select-none flex items-center justify-center">
                     <img src={challenge.image} alt="Captcha" className="h-full w-full object-cover" draggable={false} />
                </div>
                <input 
                  type="text" 
                  className={`flex-1 rounded-md border px-3 py-1 text-sm focus:ring-2 bg-input uppercase tracking-widest font-mono text-center transition-colors ${
                    verified 
                      ? 'border-success focus:ring-success text-success-foreground' 
                      : 'border-input focus:ring-primary'
                  }`}
                  placeholder="CODE"
                  maxLength={4}
                  value={input}
                  onChange={e => handleChange(e.target.value)}
                  autoComplete="off"
                />
            </div>
             <p className="text-[10px] text-muted-foreground">
                Enter the 4-character code shown in the image.
            </p>
        </div>
    );
}


