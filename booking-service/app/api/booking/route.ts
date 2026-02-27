import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { assertRoleAllowed, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/booking
// Crea una reserva aplicando reglas NativaGo dentro de una transacción:
// - arrival_at = start_at - 30m
// - deadline = start_at + 30m
// - crea Booking + BookingEvent(CREATED)
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

  const startAt = new Date(body.startAt);
  const arrivalAt = new Date(startAt.getTime() - 30 * 60 * 1000);
  const deadline = new Date(startAt.getTime() + 30 * 60 * 1000);
  const durationMinutes: number = body.durationMinutes ?? 60;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // TODO: validar slot contra Catalog Service (capacidad, solapamientos, etc.)

      const booking = await tx.booking.create({
        data: {
          userId: body.userId,
          experienceId: body.experienceId,
          slotId: body.slotId,
          status: "CONFIRMED",
          startAt,
          arrivalAt,
          deadline,
          durationMinutes,
        },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: "CREATED",
          payload: body.meta ?? null,
        },
      });

      return booking;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Error creating booking" }, { status: 400 });
  }
}
