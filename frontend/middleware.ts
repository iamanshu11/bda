import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REFRESH_COOKIE = 'bda_refresh_token';

/**
 * First-layer guard for dashboard areas: if there's no refresh-token cookie,
 * bounce to /login before the page loads. Fine-grained role checks happen
 * client-side in <RequireAuth> once the access token + user are resolved.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
