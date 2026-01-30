import { NextResponse } from 'next/server';

export async function POST() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (e) {
    // ignore backend errors; client will still clear cookies on its domain
  }
  // Clear cookies on frontend domain as well
  const res = NextResponse.json({ ok: true });
  res.cookies.set('access_token', '', { maxAge: 0, path: '/' });
  res.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
  res.cookies.set('csrf-token', '', { maxAge: 0, path: '/' });
  return res;
}
