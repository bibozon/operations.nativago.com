import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const communications = await prisma.communication.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ communications });
  } catch (error) {
    console.error("/api/communication/booking/[id] error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
