import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { assertRoleAllowed, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/booking/reschedule
// body: { bookingId, startAt, durationMinutes? }
export async function POST(req: NextRequest) {
  const auth = getAuthFromHeaders(req.headers);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    assertRoleAllowed(auth, ["user", "partner", "admin"]);
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const bookingId: string | undefined = body.bookingId;

  if (!bookingId || !body.startAt) {
    return NextResponse.json({ message: "bookingId and startAt are required" }, { status: 400 });
  }

  const newStartAt = new Date(body.startAt);
  const newArrivalAt = new Date(newStartAt.getTime() - 30 * 60 * 1000);
  const newDeadline = new Date(newStartAt.getTime() + 30 * 60 * 1000);
  const durationMinutes: number | undefined = body.durationMinutes;

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        startAt: newStartAt,
        arrivalAt: newArrivalAt,
        deadline: newDeadline,
        ...(durationMinutes ? { durationMinutes } : {}),
        status: "CONFIRMED",
      },
    });

    await tx.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: "RESCHEDULED",
        payload: {
          startAt: newStartAt,
          durationMinutes: booking.durationMinutes,
        },
      },
    });

    return booking;
  });

  return NextResponse.json(result);
}
