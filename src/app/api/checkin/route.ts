import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';
import { recordCheckIn } from '@/services/booking/transitions';

// El QR generado en la reserva codifica "NATIVAGO:<bookingCode>" (ver
// src/app/api/catalog/bookings/route.ts) — bookingCode es el identificador
// real, no el id numérico interno.
const CHECKIN_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas después del inicio de la actividad
// Tampoco antes de tiempo: el check-in es la señal real de asistencia (cuenta para
// la comisión y para las 100 reservas), no puede marcarse semanas antes.
const CHECKIN_EARLY_MS = 2 * 60 * 60 * 1000; // desde 2 horas antes del inicio

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
      experience: {
        select: {
          title: true,
          operatorId: true,
          operator: { select: { isPioneer: true, firstActivatedBookingDate: true } },
        },
      },
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

  if (Date.now() < booking.date.getTime() - CHECKIN_EARLY_MS) {
    return NextResponse.json(
      { error: 'Todavía es muy pronto — el check-in se habilita 2 horas antes del inicio de la actividad' },
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

  const checkIn = await recordCheckIn({
    bookingCode,
    actor: { role: auth.role, userId: auth.userId },
  });
  if (!checkIn.ok) {
    return NextResponse.json(
      { error: checkIn.reason === 'cancelled' ? 'Esta reserva fue cancelada — no se puede hacer check-in' : 'Reserva no encontrada' },
      { status: checkIn.reason === 'cancelled' ? 409 : 404 },
    );
  }

  // Primera reserva con check-in confirmado de un operador pionero: queda
  // registrada como su fecha de activación para el piloto (no se
  // sobrescribe en check-ins posteriores).
  if (booking.experience.operator.isPioneer && !booking.experience.operator.firstActivatedBookingDate) {
    await prisma.operator.update({
      where: { id: booking.experience.operatorId },
      data: { firstActivatedBookingDate: new Date() },
    });
  }

  // La solicitud de valoración al viajero la envía la cola de avisos (recordCheckIn la encola).

  return NextResponse.json({ ok: true, alreadyCheckedIn: checkIn.alreadyCheckedIn });
}
