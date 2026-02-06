
import logger from '@/lib/logger';

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
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('NEXT_PUBLIC_API_URL not set, using default http://localhost:3001', {
        component: 'api',
      });
    }
    return 'http://localhost:3001';
  }
  
  // Validate URL format
  try {
    new URL(apiUrl);
  } catch {
    throw new Error(
      `CRITICAL: NEXT_PUBLIC_API_URL "${apiUrl}" is not a valid URL. ` +
      'Please provide a valid URL (e.g., https://api.example.com)'
    );
  }
  
  return apiUrl;
}

// Validated API URL - will throw on startup if invalid in production
export const API_URL = validateApiUrl();

// PERFORMANCE FIX: Request deduplication - prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<unknown>>();

function createRequestKey(endpoint: string, options: RequestInit): string {
  const method = options.method || 'GET';
  const body = options.body;
  let bodyKey = '';
  if (typeof body === 'string') {
    bodyKey = body;
  } else if (body instanceof FormData) {
    bodyKey = 'formdata';
  } else if (body instanceof URLSearchParams) {
    bodyKey = body.toString();
  } else if (body instanceof Blob) {
    bodyKey = `blob:${body.type}:${body.size}`;
  } else if (body instanceof ArrayBuffer) {
    bodyKey = `arraybuffer:${body.byteLength}`;
  } else if (ArrayBuffer.isView(body)) {
    bodyKey = `arraybuffer:${body.byteLength}`;
  } else if (body) {
    try {
      bodyKey = JSON.stringify(body);
    } catch {
      bodyKey = 'body';
    }
  }
  return `${method}:${endpoint}:${bodyKey}`;
}

type RequestWithRetry = RequestInit & { __retried?: boolean; redirectOn401?: boolean; timeout?: number };
type NextFetchOptions = { next?: { revalidate?: number } };
type RequestOptions = RequestWithRetry & NextFetchOptions;

export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T | null> {
  // PERFORMANCE FIX: Deduplicate GET requests - return existing promise if in flight
  const method = options.method || 'GET';
  if (method === 'GET' && !options.__retried) {
    const requestKey = createRequestKey(endpoint, options);
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey) as Promise<T | null>;
    }
  }
  
  // Default timeout: 30 seconds
  const timeout = options.timeout || 30000;
  
  // Wrap fetch logic to manage deduplication
  const requestKey = method === 'GET' ? createRequestKey(endpoint, options) : null;
  
  const fetchPromise: Promise<T | null> = (async () => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
  
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
    // Respect FormData bodies (do not set Content-Type so browser can set boundary)
    const isFormDataBody = options.body instanceof FormData;
    const headers = new Headers(options.headers || {});
    if (!isFormDataBody && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (typeof window !== 'undefined') {
      const csrfToken = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('csrf-token='))
        ?.split('=')[1];
      if (csrfToken) {
        headers.set('x-csrf-token', csrfToken);
      }
    }

    let res: Response;
    try {
      const fetchOptions: RequestInit & NextFetchOptions = {
        ...options,
        headers,
        signal: controller.signal,
        cache: options.cache ?? 'no-store',
        // Ensure Next.js server-side fetches don't cache either
        next: { revalidate: 0, ...(options.next || {}) },
        credentials: 'include', // SECURITY FIX: Send httpOnly cookies
      };
      res = await fetch(`${API_URL}${normalizedEndpoint}`, fetchOptions);
      clearTimeout(timeoutId);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errorName = typeof err === 'object' && err && 'name' in err ? (err as { name?: string }).name : undefined;
      if (errorName === 'AbortError') {
        throw new Error(`Request timeout after ${timeout / 1000} seconds`);
      }
      const message = err instanceof Error ? err.message : 'Failed to fetch';
      throw new Error(`Network error: ${message}`);
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
            return fetchAPI<T>(endpoint, { ...options, __retried: true });
          }
        } catch (_) {
          // ignore refresh errors and fall through to redirect/error
        }
      }
      
      // Only redirect if explicitly requested AND refresh failed
      if (shouldRedirect && (options.__retried || isAuthEndpoint)) {
        try {
          await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch (_) {
          // ignore logout errors; redirect will still occur
        }
        
        // Use setTimeout to avoid race conditions with state updates
        setTimeout(() => {
          window.location.replace('/login');
        }, 100);
        return null; // Prevent throwing error after redirect
      }
      
      const err = await res.json().catch(() => ({ message: 'Unauthorized' }));
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        throw new Error(err.message);
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const errorPayload = await res.json().catch(() => ({ message: res.statusText }));
      if (errorPayload && typeof errorPayload === 'object' && 'message' in errorPayload && typeof errorPayload.message === 'string') {
        throw new Error(errorPayload.message);
      }
      throw new Error(`API Error: ${res.statusText}`);
    }

    try {
      // Some endpoints legitimately return no content (e.g. 204 or empty body).
      // In those cases, avoid throwing a JSON parse error and just return null.
      const data = await res.json();
      return data as T;
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        return null;
      }
      if (err && typeof err === 'object' && 'name' in err && (err as { name?: string }).name === 'Syntax Error') {
        return null;
      }
      throw err;
    } finally {
      // Clean up deduplication map
      if (requestKey) {
        pendingRequests.delete(requestKey);
      }
    }
  })();
  
  // Store promise for GET requests to enable deduplication
  if (requestKey) {
    pendingRequests.set(requestKey, fetchPromise);
  }
  
  return fetchPromise;
}

// Export as both fetchAPI and api for convenience
export const api = fetchAPI;
