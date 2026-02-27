import { NextRequest, NextResponse } from "next/server";
import { listSlots } from "@/services/catalog/application/catalogService";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const slots = await listSlots();
  return NextResponse.json(slots);
}
