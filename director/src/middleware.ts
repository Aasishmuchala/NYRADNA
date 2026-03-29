import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Lightweight middleware that gates API routes behind a session cookie.
 * In development mode, all requests are allowed (mirrors AuthContext dev bypass).
 * In production, API routes require a valid `director-session` cookie.
 * The /api/health endpoint is always public for uptime monitoring.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow health check
  if (pathname === '/api/health') {
    return NextResponse.next();
  }

  // In development, skip auth checks (matches AuthContext dev user behavior)
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // Check for session cookie on API routes
  const session = request.cookies.get('director-session');
  if (!session?.value) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
