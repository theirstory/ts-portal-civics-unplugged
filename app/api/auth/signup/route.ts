import { NextResponse } from 'next/server';
import { createUser, isUsernameTaken } from '@/lib/users';
import { buildAuthCookie, getSitePassword } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isAuthEnabled, requireSitePassword } from '@/config/organizationConfig';

export async function POST(request: Request) {
  if (!isAuthEnabled) {
    return NextResponse.json({ error: 'Auth is not enabled' }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          'Database is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
      },
      { status: 503 },
    );
  }

  try {
    const { fullName, username, sitePassword } = await request.json();

    if (!fullName?.trim() || !username?.trim()) {
      return NextResponse.json({ error: 'Full name and username are required' }, { status: 400 });
    }

    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 },
      );
    }

    if (requireSitePassword) {
      const expectedPassword = getSitePassword();
      if (!expectedPassword) {
        return NextResponse.json(
          { error: 'Site password is not configured. Set the SITE_PASSWORD environment variable.' },
          { status: 500 },
        );
      }
      if (sitePassword !== expectedPassword) {
        return NextResponse.json({ error: 'Incorrect site password' }, { status: 403 });
      }
    }

    if (await isUsernameTaken(trimmedUsername)) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const { user, token } = await createUser(trimmedName, trimmedUsername);

    const response = NextResponse.json({ user });
    response.cookies.set(buildAuthCookie(token));
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
