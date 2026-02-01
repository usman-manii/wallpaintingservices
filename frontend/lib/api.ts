
// P4 Security Fix: Validate NEXT_PUBLIC_API_URL is configured
function validateApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // In production, API URL must be explicitly set
  if (process.env.NODE_ENV === 'production' && !apiUrl) {
    throw new Error(
      'CRITICAL: NEXT_PUBLIC_API_URL environment variable is not set. ' +
      'The application cannot function without a configured backend URL.'
    );
  }
  
  // In development, default to localhost with a warning
  if (!apiUrl) {
    if (typeof window !== 'undefined') {
      console.warn('[Config] NEXT_PUBLIC_API_URL not set, using default http://localhost:3001');
    }
    return 'http://localhost:3001';
  }
  
  // Validate URL format
  try {
    new URL(apiUrl);
  } catch (error) {
    throw new Error(
      `CRITICAL: NEXT_PUBLIC_API_URL "${apiUrl}" is not a valid URL. ` +
      'Please provide a valid URL (e.g., https://api.example.com)'
    );
  }
  
  return apiUrl;
}

// Validated API URL - will throw on startup if invalid in production
export const API_URL = validateApiUrl();

type RequestWithRetry = RequestInit & { __retried?: boolean; redirectOn401?: boolean };

export async function fetchAPI(endpoint: string, options: RequestWithRetry = {}) {
  // Respect FormData bodies (do not set Content-Type so browser can set boundary)
  const isFormDataBody = options && (options as any).body instanceof FormData;
  const headers: Record<string,string> = {
    ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string,string>) || {}),
    ...(typeof window !== 'undefined'
      ? { 'x-csrf-token': document.cookie.split('; ').find(c => c.startsWith('csrf-token='))?.split('=')[1] || '' }
      : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      cache: options.cache ?? 'no-store',
      // Ensure Next.js server-side fetches don't cache either
      next: { revalidate: 0, ...(options as any).next },
      credentials: 'include', // SECURITY FIX: Send httpOnly cookies
    });
  } catch (err: any) {
    throw new Error(`Network error: ${err?.message || 'Failed to fetch'}`);
  }

  // Special handling for unauthorized responses in browser environments
  if (res.status === 401 && typeof window !== 'undefined') {
    const shouldRedirect = options.redirectOn401 === true;
    // Attempt silent refresh once
    if (!options.__retried) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (refreshRes.ok) {
          return fetchAPI(endpoint, { ...options, __retried: true });
        }
      } catch (_) {
        // ignore refresh errors
      }
    }
    if (shouldRedirect) {
      try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      } catch (_) {}
      window.location.replace('/auth');
    }
    const err = await res.json().catch(() => ({ message: 'Unauthorized' }));
    throw new Error(err.message || 'Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.statusText}`);
  }

  try {
    // Some endpoints legitimately return no content (e.g. 204 or empty body).
    // In those cases, avoid throwing a JSON parse error and just return null.
    const data = await res.json();
    return data;
  } catch (err: any) {
    if (err instanceof SyntaxError || err?.name === 'SyntaxError') {
      return null;
    }
    throw err;
  }
}
