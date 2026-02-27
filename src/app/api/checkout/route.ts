import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import prisma from '@/lib/db';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

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

  const exp = await prisma.experience.findUnique({
    where: { id: experienceId },
  });

  const stripe = getStripe();

  if (!exp) {
    return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
  }

  const price = Number(exp.price);
  const total = price * guests;
  const deposit = total * 0.15;
  const remaining = total - deposit;
  const unitAmount = Math.round((deposit / guests) * 100);

  const booking = await prisma.booking.create({
    data: {
      experienceId: exp.id,
      date: new Date(date),
      guests,
      customerName,
      customerEmail,
      amount: total,
      depositAmount: deposit,
      remainingAmount: remaining,
      paymentStatus: 'PENDING',
      paymentType: 'DEPOSIT',
    },
  });

  const qrData = JSON.stringify({
    bookingId: booking.id,
    experienceId: exp.id,
  });

  try {
    const qr = await QRCode.toDataURL(qrData);

    await prisma.booking.update({
      where: { id: booking.id },
      data: { qrCode: qr },
    });
  } catch (error) {
    console.error('Failed to generate QR code for booking', error);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'pix'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          unit_amount: unitAmount,
          product_data: {
            name: exp.title,
          },
        },
        quantity: guests,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?booking=${booking.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    metadata: {
      bookingId: booking.id.toString(),
    },
  });

  return NextResponse.json({ url: session.url });
}
