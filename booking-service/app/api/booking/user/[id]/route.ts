import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { assertRoleAllowed, getAuthFromHeaders } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/booking/user/{id}
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuthFromHeaders(_req.headers);
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    // Un usuario sólo debería ver sus propias reservas en producción.
    // Aquí permitimos user|partner|admin y se podría reforzar comparando auth.sub con params.id.
    assertRoleAllowed(auth, ["user", "partner", "admin"]);
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: params.id },
    orderBy: { startAt: "desc" },
  });

  return NextResponse.json(bookings);
}
