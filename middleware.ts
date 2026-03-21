import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Read auth config at build/startup time from config.json
// Note: we can't import from organizationConfig here because middleware
// runs in the Edge runtime. We read the JSON directly.
import configData from './config.json';

const isAuthEnabled = configData.features?.auth?.enabled ?? false;

const PUBLIC_PATHS = ['/signup', '/api/auth'];

export function middleware(request: NextRequest) {
  // If auth is disabled, allow everything through
  if (!isAuthEnabled) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow public paths, static files, and Next.js internals
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('cu_auth_token')?.value;
  if (!token) {
    const signupUrl = new URL('/signup', request.url);
    return NextResponse.redirect(signupUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
