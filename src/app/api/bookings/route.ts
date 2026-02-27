import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => null);

  if (!data) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { experienceId, date, guests, customerName, customerEmail } = data as {
    experienceId?: number;
    date?: string;
    guests?: number;
    customerName?: string;
    customerEmail?: string;
  };

  if (!experienceId || !date || !guests || !customerName || !customerEmail) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const booking = await prisma.booking.create({
    data: {
      experienceId,
      date: new Date(date),
      guests,
      customerName,
      customerEmail,
    },
  });

  return NextResponse.json(booking);
}
