'use client';

import { fetchAPI } from './api';
import type { JsonValue } from '@/types/json';

const ADMIN_ROLES = ['ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR'] as const;

export type AuthUser = {
  id?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  name?: string;
} & Record<string, JsonValue>;

export type AuthRouter = { push: (href: string) => void; replace: (href: string) => void };

type AdminRole = (typeof ADMIN_ROLES)[number];

const toAuthUser = (value: unknown): AuthUser => {
  if (!value || typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;
  const user: AuthUser = {};
  if (typeof obj.id === 'string') user.id = obj.id;
  if (typeof obj.email === 'string') user.email = obj.email;
  if (typeof obj.role === 'string') user.role = obj.role;
  if (typeof obj.firstName === 'string') user.firstName = obj.firstName;
  if (typeof obj.lastName === 'string') user.lastName = obj.lastName;
  if (typeof obj.username === 'string') user.username = obj.username;
  if (typeof obj.name === 'string') user.name = obj.name;
  return user;
};

export const extractAuthUser = (data: unknown): AuthUser => {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const nested = obj.user;
    if (nested && typeof nested === 'object') {
      return toAuthUser(nested);
    }
    return toAuthUser(obj);
  }
  return {};
};

export const isAdminRole = (role?: string | null): role is AdminRole =>
  typeof role === 'string' && ADMIN_ROLES.includes(role as AdminRole);

export const resolvePostAuthDestination = (role?: string | null, next?: string | null) => {
  if (next) return next;
  return isAdminRole(role) ? '/dashboard' : '/';
};

type LoginPayload = {
  email: string;
  password: string;
  captchaToken?: string;
  captchaId?: string;
  captchaType?: string;
};

type RegisterPayload = LoginPayload & {
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
};

export async function loginUser(body: LoginPayload): Promise<AuthUser> {
  const data = await fetchAPI('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    redirectOn401: false,
  });

  return extractAuthUser(data);
}

export async function registerUser(body: RegisterPayload): Promise<AuthUser> {
  const data = await fetchAPI('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    redirectOn401: false,
  });

  return extractAuthUser(data);
}

export async function refreshUserSession() {
  return fetchAPI('/auth/refresh', {
    method: 'POST',
    cache: 'no-store',
    redirectOn401: false,
  }).catch(() => null);
}

/**
 * Clear auth cookies across both the frontend and backend domains.
 * Uses the Next.js API route to guarantee frontend domain cookies are wiped
 * even when the backend token is already expired.
 */
export async function logoutEverywhere() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (_) {
    // Swallow network errors; callers also clear client state.
  }
}

/**
 * Persist role, refresh session state, and route to the correct destination.
 */
export async function finalizeAuthSuccess(options: {
  user?: AuthUser | null;
  refreshSession?: () => Promise<void>;
  router?: AuthRouter;
  next?: string | null;
  replace?: boolean;
}) {
  const role = options.user?.role;
  if (typeof window !== 'undefined' && role) {
    localStorage.setItem('user_role', role);
  }

  if (options.refreshSession) {
    await options.refreshSession().catch(() => {});
  }

  const destination = resolvePostAuthDestination(role, options.next ?? null);
  if (options.router) {
    options.replace ? options.router.replace(destination) : options.router.push(destination);
  }
  return destination;
}

