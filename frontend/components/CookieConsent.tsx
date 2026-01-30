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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-sm">
        We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
      </div>
      <button 
        onClick={accept}
        className="bg-white text-black px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 whitespace-nowrap"
      >
        Accept All
      </button>
    </div>
  );
}
