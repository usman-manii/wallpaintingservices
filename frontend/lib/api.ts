
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
    // Only log in development (server-side check)
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      // Using console here is acceptable for critical configuration warnings
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

type RequestWithRetry = RequestInit & { __retried?: boolean; redirectOn401?: boolean; timeout?: number };

export async function fetchAPI(endpoint: string, options: RequestWithRetry = {}) {
  // Default timeout: 30 seconds
  const timeout = options.timeout || 30000;
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
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
    res = await fetch(`${API_URL}${normalizedEndpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
      cache: options.cache ?? 'no-store',
      // Ensure Next.js server-side fetches don't cache either
      next: { revalidate: 0, ...(options as any).next },
      credentials: 'include', // SECURITY FIX: Send httpOnly cookies
    });
    clearTimeout(timeoutId);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout / 1000} seconds`);
    }
    throw new Error(`Network error: ${err?.message || 'Failed to fetch'}`);
  }

  // Special handling for unauthorized responses in browser environments
  if (res.status === 401 && typeof window !== 'undefined') {
    const shouldRedirect = options.redirectOn401 === true;
    // Attempt silent refresh once (but NOT for refresh/logout endpoints to prevent infinite loop)
    const isAuthEndpoint = endpoint.includes('/auth/refresh') || endpoint.includes('/auth/logout');
    
    if (!options.__retried && !isAuthEndpoint) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });
        if (refreshRes.ok) {
          // Mark as retried to prevent infinite loops
          return fetchAPI(endpoint, { ...options, __retried: true });
        }
      } catch (_) {
        // ignore refresh errors and fall through to redirect/error
      }
    }
    
    // Only redirect if explicitly requested AND refresh failed
    if (shouldRedirect && (options.__retried || isAuthEndpoint)) {
      try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      } catch (_) {}
      
      // Use setTimeout to avoid race conditions with state updates
      setTimeout(() => {
        window.location.replace('/auth');
      }, 100);
      return; // Prevent throwing error after redirect
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

// Export as both fetchAPI and api for convenience
export const api = fetchAPI;
