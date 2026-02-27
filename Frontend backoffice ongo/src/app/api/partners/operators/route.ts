import { NextRequest, NextResponse } from "next/server";
import { partnerPrisma } from "@/services/partner/infrastructure/db/client";
import { requireAdmin } from "@/infrastructure/auth/jwt-guard";

export async function POST(req: NextRequest) {
  await requireAdmin(req);
  const body = await req.json();

  const partner = await partnerPrisma.partner.findUnique({ where: { id: body.partnerId } });
  if (!partner) {
    return NextResponse.json({ message: "Partner not found" }, { status: 400 });
  }

  const operator = await partnerPrisma.operator.create({
    data: {
      partnerId: body.partnerId,
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      status: body.status ?? "ACTIVE",
    },
  });

  return NextResponse.json(operator, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await requireAdmin(req);
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  const operator = await partnerPrisma.operator.update({
    where: { id: body.id },
    data: {
      name: body.name ?? undefined,
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
      status: body.status ?? undefined,
    },
  });

  return NextResponse.json(operator);
}
