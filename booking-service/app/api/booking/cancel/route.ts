import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { assertRoleAllowed, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/booking/cancel
// body: { bookingId, reason? }
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

  if (!bookingId) {
    return NextResponse.json({ message: "bookingId is required" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    await tx.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: "CANCELLED",
        payload: body.reason ? { reason: body.reason } : null,
      },
    });

    return booking;
  });

  return NextResponse.json(result);
}
