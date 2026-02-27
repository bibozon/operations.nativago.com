import { NextRequest, NextResponse } from "next/server";

// Por diseño de multi-app DB, el CMS no modifica bookings.
// Marketplace es la única fuente de verdad transaccional.
export async function POST(_req: NextRequest, _context: { params: { id: string } }) {
  return NextResponse.json(
    { message: "Bookings son de solo lectura desde operations.nativago (fuente de verdad: marketplace)." },
    { status: 405 },
  );
}
