import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { assertRoleAllowed, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/booking/cron
// Pensado para Vercel Cron: auto-cancel no_start y auto-complete por duración.
export async function POST(_req: NextRequest) {
  const auth = getAuthFromHeaders(_req.headers);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    // Cron: restringido a service token o admin.
    assertRoleAllowed(auth, ["admin"]);
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  // Auto-cancel: reservas confirmadas que no han hecho check-in y cuyo deadline ya pasó.
  const autoCancelled = await prisma.booking.updateMany({
    where: {
      status: "CONFIRMED",
      checkedInAt: null,
      deadline: { lt: now },
    },
    data: {
      status: "CANCELLED",
    },
  });

  // Crear eventos para las cancelaciones automáticas.
  // (Simplificado: no distinguimos por id aquí por eficiencia; se podría hacer findMany + createMany).

  // Auto-complete: reservas con CHECKED_IN cuyo fin estimado (startAt + duration) ya pasó.
  const bookingsToComplete = await prisma.booking.findMany({
    where: {
      status: "CHECKED_IN",
    },
  });

  let completedCount = 0;

  for (const b of bookingsToComplete) {
    const endTime = new Date(b.startAt.getTime() + b.durationMinutes * 60 * 1000);
    if (endTime <= now) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { status: "COMPLETED" },
      });
      await prisma.bookingEvent.create({
        data: {
          bookingId: b.id,
          type: "AUTO_COMPLETED",
          payload: { endTime },
        },
      });
      completedCount += 1;
    }
  }

  return NextResponse.json({
    autoCancelled: autoCancelled.count,
    autoCompleted: completedCount,
    runAt: now,
  });
}
