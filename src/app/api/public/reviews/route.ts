import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Endpoint público (sin auth): el cliente final usa esto desde la página de
// calificación del MVP, identificado por su bookingCode (el mismo código
// que ya recibe en el QR y en "mis reservas" — no es información nueva
// expuesta). Solo se puede calificar después de check-in confirmado, y
// solo una vez por reserva.

async function loadBookingForReview(bookingCode: string) {
  return prisma.booking.findUnique({
    where: { bookingCode },
    select: {
      id: true,
      status: true,
      customerName: true,
      experience: {
        select: {
          id: true,
          title: true,
          operatorId: true,
          operator: { select: { name: true } },
        },
      },
      review: { select: { rating: true, comment: true, createdAt: true } },
    },
  });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim();
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 });
  }

  const booking = await loadBookingForReview(code);
  if (!booking) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  if (booking.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'not_confirmed' }, { status: 409 });
  }

  return NextResponse.json({
    experienceTitle: booking.experience.title,
    operatorName: booking.experience.operator.name,
    guestName: booking.customerName,
    alreadyReviewed: Boolean(booking.review),
    rating: booking.review?.rating ?? null,
    comment: booking.review?.comment ?? null,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  const rating = Number(body?.rating);
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 1000) : null;

  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'invalid_rating' }, { status: 400 });
  }

  const booking = await loadBookingForReview(code);
  if (!booking) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (booking.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'not_confirmed' }, { status: 409 });
  }
  if (booking.review) {
    return NextResponse.json({ error: 'already_reviewed' }, { status: 409 });
  }

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      experienceId: booking.experience.id,
      operatorId: booking.experience.operatorId,
      rating,
      comment: comment || null,
      customerName: booking.customerName,
    },
  });

  return NextResponse.json({ ok: true });
}
