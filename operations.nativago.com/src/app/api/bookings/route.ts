import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRemainingCapacity } from '@/lib/availability';
import { sendBookingEmail } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  let where = {};
  if (user.role === 'OPERATOR_AGENCY' || user.role === 'OPERATOR_FREELANCE') {
    where = {
      experience: { operatorId: user.operatorId }
    };
  }
  const bookings = await db.booking.findMany({
    where,
    include: {
      experience: { select: { id: true, title: true } },
      slot: { select: { id: true, date: true, time: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bookings);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { experienceId, slotId, travelerName, travelerEmail, seats } = body;
  if (!experienceId || !slotId || !travelerName || !travelerEmail || !seats) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
  }

  // Validar slot existe
  const slot = await db.slot.findUnique({ where: { id: slotId } });
  if (!slot) {
    return NextResponse.json({ error: 'Slot no existe' }, { status: 404 });
  }

  // Validar experiencia publicada
  const experience = await db.experience.findUnique({ where: { id: experienceId, status: 'PUBLISHED' } });
  if (!experience) {
    return NextResponse.json({ error: 'Experiencia no publicada' }, { status: 404 });
  }

  // Validar capacidad suficiente (dentro de la transacción)
  let booking;
  try {
    booking = await db.$transaction(async (tx) => {
      const remaining = await getRemainingCapacity(slotId);
      if (seats > remaining) {
        throw new Error('NO_CAPACITY');
      }
      return await tx.booking.create({
        data: {
          experienceId,
          slotId,
          travelerName,
          travelerEmail,
          seats,
          status: 'PENDING',
        },
      });
    });
  } catch (err: any) {
    if (err.message === 'NO_CAPACITY') {
      return NextResponse.json({ error: 'NO_CAPACITY' }, { status: 400 });
    }
    throw err;
  }

  // Enviar email de confirmación (mock)
  await sendBookingEmail(travelerEmail, booking);

  return NextResponse.json(booking);
}
