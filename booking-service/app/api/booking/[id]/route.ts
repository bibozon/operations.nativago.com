import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { assertRoleAllowed, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/booking/{id}
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuthFromHeaders(_req.headers);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    assertRoleAllowed(auth, ["user", "partner", "admin"]);
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { events: true },
  });

  if (!booking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(booking);
}
