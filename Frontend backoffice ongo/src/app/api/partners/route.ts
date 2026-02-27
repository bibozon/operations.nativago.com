import { NextRequest, NextResponse } from "next/server";
import { listPartners, upsertPartner } from "@/services/partner/application/partnerService";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const partners = await listPartners();
  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const partner = await upsertPartner({
      name: body.name,
      legalName: body.legalName,
      taxId: body.taxId,
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Error creating partner" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  try {
    const partner = await upsertPartner({
      id: body.id,
      name: body.name,
      legalName: body.legalName,
      taxId: body.taxId,
    });

    return NextResponse.json(partner);
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Error updating partner" }, { status: 400 });
  }
}
