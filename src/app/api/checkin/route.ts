import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireOperator } from '@/lib/requireRole';

export async function POST(req: NextRequest) {
  const auth = await requireOperator();

  const body = await req.json().catch(() => null);

  if (!body || typeof body.bookingId !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { bookingId } = body as { bookingId: number };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      experience: {
        include: {
          operator: true,
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Ensure the booking belongs to the operator making the request
  if (!booking.experience.operator || booking.experience.operator.userId !== auth.userId) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED' },
  });

  return NextResponse.json({ ok: true });
}
