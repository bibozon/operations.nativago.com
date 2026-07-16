import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Detalle de una reserva por bookingCode — requiere el email del huésped
// como prueba de ownership (mismo modelo que el marketplace ya usaba).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'email inválido' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: code },
    include: {
      experience: { select: { title: true, images: true } },
      country: { select: { defaultCurrency: { select: { code: true } } } },
    },
  });

  if (!booking || booking.customerEmail !== email) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    bookingCode: booking.bookingCode,
    experienceTitle: booking.experience.title,
    experienceImage: booking.experience.images[0] ?? null,
    date: booking.date,
    guests: booking.guests,
    status: booking.status,
    amount: booking.amount,
    depositAmount: booking.depositAmount,
    remainingAmount: booking.remainingAmount,
    currency: booking.country?.defaultCurrency.code ?? 'COP',
    qrCode: booking.qrCode,
    createdAt: booking.createdAt,
  });
}
