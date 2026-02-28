import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public access to catalog and public APIs
  if (
    pathname.startsWith('/api/catalog/') ||
    pathname.startsWith('/api/public/') ||
    pathname === '/' ||
    pathname.startsWith('/explorar') ||
    pathname.startsWith('/experiencia/')
  ) {
    return NextResponse.next();
  }

  // Require auth for admin/private APIs
  if (
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/private/')
  ) {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/private/:path*',
    '/api/catalog/:path*',
    '/api/public/:path*',
    '/explorar',
    '/experiencia/:path*',
    '/',
  ],
};
