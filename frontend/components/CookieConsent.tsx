'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-sidebar text-sidebar-foreground p-4 shadow-lg z-50 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-sm">
        We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
      </div>
      <button 
        onClick={accept}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
      >
        Accept All
      </button>
    </div>
  );
}
