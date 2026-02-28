import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);

  if (!data) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { experienceId, date, guests, customerName, customerEmail } = data as {
    experienceId?: string;
    date?: string;
    guests?: number;
    customerName?: string;
    customerEmail?: string;
  };

  if (!experienceId || !date || !guests || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Use experienceId as string for Experience lookup
  if (typeof experienceId !== 'string' || !experienceId) {
    return NextResponse.json({ error: 'Invalid experienceId' }, { status: 400 });
  }

  // Fetch experience price
  const experience = await prisma.experience.findUnique({
    where: { id: experienceId }
  });

  if (!experience) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  // Calculate amounts
  const amount = experience.price * guests;
  const depositAmount = Math.round(amount * 0.15);
  const remainingAmount = amount - depositAmount;

  const booking = await prisma.booking.create({
    data: {
      experienceId,
      date: new Date(date),
      guests,
      customerName,
      customerEmail,
      amount,
      depositAmount,
      remainingAmount,
    },
  });

  return NextResponse.json({
    ok: true,
    booking
  });
}
