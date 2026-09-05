import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { signAuthToken, type AuthRole } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

// Sin esto, /api/auth/login quedaba como el único endpoint sensible del CMS
// sin límite de intentos (bookings y checkout del marketplace ya lo usan) —
// abierto a fuerza bruta de credenciales sin restricción. Solo cuenta
// intentos FALLIDOS (no cada login exitoso) — es lo que realmente protege
// contra fuerza bruta, y evita bloquear tráfico legítimo repetido desde la
// misma IP/NAT compartida.
function rateLimitedFailure(ip: string): NextResponse | null {
  const { ok } = checkRateLimit(`login-fail:${ip}`, 10);
  if (!ok) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
      { status: 429 },
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  const body = await request.json().catch(() => null);

  const { email, password } = (body ?? {}) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { operatorMemberships: { select: { operatorId: true, role: true }, take: 1 } },
  });

  if (!user) {
    return rateLimitedFailure(ip) ?? NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return rateLimitedFailure(ip) ?? NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const membership = user.operatorMemberships[0];

  const token = signAuthToken({
    userId: user.id,
    email: user.email,
    role: user.role as AuthRole,
    operatorId: membership?.operatorId ?? null,
    operatorRole: membership?.role ?? null,
    name: user.name ?? null,
  });

  const response = NextResponse.json({ ok: true });

  response.cookies.set('auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
