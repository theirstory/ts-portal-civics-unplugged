import { cookies } from 'next/headers';
import { findUserByToken } from './users';
import { isSupabaseConfigured } from './supabase/config';
import { User } from '@/types/user';

const AUTH_COOKIE = 'cu_auth_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return findUserByToken(token);
}

export function buildAuthCookie(token: string) {
  return {
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}

export function buildLogoutCookie() {
  return {
    name: AUTH_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}

export function getSitePassword(): string | null {
  return process.env.SITE_PASSWORD || null;
}

export const AUTH_COOKIE_NAME = AUTH_COOKIE;
