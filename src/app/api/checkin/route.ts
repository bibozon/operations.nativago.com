import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();

  const body = await req.json().catch(() => null);

  if (!body || typeof body.bookingId !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { bookingId } = body as { bookingId: number };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      experience: { select: { operatorId: true } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
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

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED' },
  });

  return NextResponse.json({ ok: true });
}
