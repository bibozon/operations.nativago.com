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
      experience: {
        include: { city: true },
      },
    },
  });

  // Adaptamos al tipo Booking que espera el frontend
  const mapped = bookings.map((b) => ({
    id: b.id,
    experienceTitle: b.experience.title,
    userName: b.clientName || b.user.name,
    status: b.status,
    city: b.experience.city ? b.experience.city.name : undefined,
    createdAt: b.createdAt.toISOString(),
  }));

  return NextResponse.json(mapped);
}
