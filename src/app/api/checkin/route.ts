import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';

// El QR generado en la reserva codifica "NATIVAGO:<bookingCode>" (ver
// src/app/api/catalog/bookings/route.ts) — bookingCode es el identificador
// real, no el id numérico interno.
const CHECKIN_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas después del inicio de la actividad

export async function POST(req: NextRequest) {
  const auth = await requireAuth();

  const body = await req.json().catch(() => null);

  if (!body || typeof body.bookingCode !== 'string' || !body.bookingCode.trim()) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { bookingCode } = body as { bookingCode: string };

  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      experience: { select: { operatorId: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  // SUPERADMIN/SUPPORT pueden hacer check-in de cualquier reserva; el resto
  // (operadores) solo de las de su propio operador.
  if (!isStaffOrAbove(auth.role) && booking.experience.operatorId !== auth.operatorId) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  if (booking.status === 'CANCELLED') {
    return NextResponse.json(
      { error: 'Esta reserva fue cancelada — no se puede hacer check-in' },
      { status: 409 },
    );
  }

  const expiresAt = booking.date.getTime() + CHECKIN_WINDOW_MS;
  if (Date.now() > expiresAt) {
    return NextResponse.json(
      { error: 'El QR venció — pasaron más de 2 horas desde el inicio de la actividad' },
      { status: 409 },
    );
  }

  await prisma.booking.update({
    where: { bookingCode },
    data: { status: 'CONFIRMED' },
  });

  return NextResponse.json({ ok: true });
}
