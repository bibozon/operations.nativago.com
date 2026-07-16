import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cancelación por el propio huésped (ownership por email) — regla de corte
// de 24h portada del marketplace (nativago-mvp/api/checkout/[id]/cancel).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.toLowerCase().trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'email inválido' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { bookingCode: code } });

  if (!booking || booking.customerEmail !== email) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }
  if (booking.status === 'CANCELLED') {
    return NextResponse.json({ error: 'La reserva ya fue cancelada' }, { status: 400 });
  }

  const hoursUntil = (booking.date.getTime() - Date.now()) / 3_600_000;
  if (hoursUntil < 24) {
    return NextResponse.json(
      { error: 'No se puede cancelar con menos de 24 horas de anticipación. Contacta al operador por WhatsApp.' },
      { status: 400 },
    );
  }

  await prisma.booking.update({
    where: { bookingCode: code },
    data: { status: 'CANCELLED', cancelReason: (body?.reason as string | undefined) ?? null },
  });

  return NextResponse.json({ ok: true });
}
