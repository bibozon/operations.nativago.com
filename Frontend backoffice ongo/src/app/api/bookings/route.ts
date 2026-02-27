import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/client";

export async function GET(req: NextRequest) {
  const operatorId = req.nextUrl.searchParams.get("operatorId");

  const bookings = await prisma.booking.findMany({
    where: operatorId
      ? {
          experience: {
            operatorId,
          },
        }
      : undefined,
    orderBy: { startAt: "desc" },
    include: {
      user: true,
      experience: true,
      slot: true,
      communications: true,
    },
  });

  const mapped = bookings.map((b) => ({
    id: b.id,
    cliente: b.clientName || b.user.name,
    clienteEmail: b.clientEmail || b.user.email,
    experiencia: b.experience.title,
    fecha: b.startAt,
    estado: b.status,
    arrival_at: b.arrivalAt,
    deadline: b.deadline,
    monto_85: b.amountToCollect,
    slot: {
      id: b.slot.id,
      date: b.slot.date,
      startTime: b.slot.startTime,
      capacity: b.slot.capacity,
    },
    comunicaciones: b.communications.map((c) => ({
      id: c.id,
      channel: c.channel,
      status: c.status,
      sentAt: c.sentAt,
    })),
  }));

  return NextResponse.json(mapped);
}
