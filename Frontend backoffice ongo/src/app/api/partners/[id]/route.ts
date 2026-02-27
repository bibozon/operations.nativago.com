import { NextRequest, NextResponse } from "next/server";
import { getPartnerById } from "@/services/partner/application/partnerService";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const partner = await getPartnerById(params.id);
  if (!partner) {
    return NextResponse.json({ message: "Partner not found" }, { status: 404 });
  }
  return NextResponse.json(partner);
}
