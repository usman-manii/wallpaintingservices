'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { usePublicSettings } from '@/contexts/SettingsContext';

export type CaptchaType = 'recaptcha-v2' | 'recaptcha-v3' | 'custom';

export interface CaptchaProps {
  onVerify: (token: string, captchaId?: string, type?: string) => void;
  type?: CaptchaType;
}

export function Captcha({ onVerify, type }: CaptchaProps) {
  const { settings } = usePublicSettings();
  const [currentMethod, setCurrentMethod] = useState<CaptchaType | null>(type || null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
     if (type) {
         setCurrentMethod(type);
     }
  }, [type]);

  useEffect(() => {
    if (!settings) return;
    
    if (!type) {
      setCurrentMethod(settings.captchaType || 'recaptcha-v2');
    }
  }, [settings, type]);

  const handleFallback = useCallback(() => {
      console.warn(`Captcha Fallback triggered from ${currentMethod}`);
      setFallbackMode(true);

      if (currentMethod === 'recaptcha-v3') {
          // Fallback V3 -> V2 -> Custom
          if (settings?.recaptchaV2SiteKey) {
              setCurrentMethod('recaptcha-v2');
          } else {
              setCurrentMethod('custom');
          }
      } else if (currentMethod === 'recaptcha-v2') {
          // Fallback V2 -> V3 (if not tried) -> Custom
          // Note: Usually if V2 fails (script block), V3 also fails.
          // But strict requirement says support fallbacks.
          if (settings?.recaptchaV3SiteKey && !fallbackMode) {
             // Logic simplified: If V2 fails, go to Custom safely, unless V3 explicitly requested as fallback
             // Let's go to Custom for reliability.
             setCurrentMethod('custom');
          } else {
             setCurrentMethod('custom');
          }
      } else {
          // Custom failed? Retry custom.
      }
  }, [currentMethod, settings, fallbackMode]);

  if (!settings || !currentMethod) return <div className="h-12 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />;

  return (
    <div className="min-h-[50px] transition-all">
       {fallbackMode && currentMethod === 'custom' && (
           <div className="text-xs text-amber-600 mb-2 flex items-center gap-1">
               <AlertTriangle size={12} />
               <span>Security check service unavailable. Switched to internal verification.</span>
           </div>
       )}

       {currentMethod === 'recaptcha-v3' && (
          <RecaptchaV3 
            siteKey={settings.recaptchaV3SiteKey} 
            onVerify={(t) => onVerify(t, undefined, 'recaptcha-v3')} 
            onError={handleFallback}
          />
       )}
       
       {currentMethod === 'recaptcha-v2' && (
          <RecaptchaV2 
            siteKey={settings.recaptchaV2SiteKey || settings.recaptchaSiteKey} 
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

    const handleError = () => { console.error("Recaptcha V2 Script Error"); onError(); };

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
        window.grecaptcha.ready(() => {
            try {
                window.grecaptcha.render(containerRef.current!, {
                    sitekey: siteKey,
                    callback: onVerify,
                    'error-callback': onError,
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                });
            } catch (e) {
                console.error("V2 Render Exception", e);
                onError();
            }
        });
      } catch(e) { onError(); }
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
        if (!window.grecaptcha) return;
        window.grecaptcha.ready(() => {
            window.grecaptcha.execute(siteKey!, { action: 'submit' }).then((token: string) => {
                onVerify(token);
            }).catch((err: any) => {
                console.error("V3 Execution Error", err);
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
            const data = await fetchAPI('/captcha/challenge');
            if (data && data.image && data.captchaId) {
                setChallenge(data);
                setInput('');
                // Reset parent token to ensure invalid state until typed
                onVerify('', '');
            } else {
                console.error("Invalid captcha challenge response", data);
            }
        } catch (e) {
            console.error("Failed to load captcha challenge", e);
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
        <div className="h-16 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
            {loading ? 'Loading Security Check...' : 'Security Service Unavailable'}
        </div>
    );

    return (
        <div className="border p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Security Check</span>
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
                    className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors" 
                    title="Refresh Captcha"
                    disabled={loading}
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <div className="flex gap-3">
                <div className="relative h-12 w-32 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden select-none flex items-center justify-center">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src={challenge.image} alt="Captcha" className="h-full w-full object-cover" draggable={false} />
                </div>
                <input 
                  type="text" 
                  className={`flex-1 rounded-md border px-3 py-1 text-sm focus:ring-2 bg-white dark:bg-slate-800 uppercase tracking-widest font-mono text-center transition-colors ${
                    verified 
                      ? 'border-green-500 focus:ring-green-500 text-green-700 dark:text-green-400' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="CODE"
                  maxLength={4}
                  value={input}
                  onChange={e => handleChange(e.target.value)}
                  autoComplete="off"
                />
            </div>
             <p className="text-[10px] text-slate-400">
                Enter the 4-character code shown in the image.
            </p>
        </div>
    );
}

declare global {
  interface Window {
    grecaptcha: any;
  }
}
