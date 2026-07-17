import { NextRequest, NextResponse } from 'next/server';

// El middleware corre en Edge Runtime — no puede importar jsonwebtoken (Node.js only).
// Hace una comprobación de presencia + estructura básica del JWT sin verificar firma;
// la verificación criptográfica real ocurre en cada route handler (Node.js).
function hasValidTokenShape(request: NextRequest): boolean {
  const token = request.cookies.get('auth')?.value;
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return Boolean(payload?.userId && payload?.role);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas — sin auth
  if (
    pathname.startsWith('/api/catalog/') ||
    pathname.startsWith('/api/public/') ||
    pathname === '/' ||
    pathname.startsWith('/explorar') ||
    pathname.startsWith('/experiencia/')
  ) {
    return NextResponse.next();
  }

  // Rutas protegidas — requieren token con forma válida
  if (
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/private/')
  ) {
    if (!hasValidTokenShape(request)) {
      return NextResponse.redirect(new URL('/login', request.url));
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
