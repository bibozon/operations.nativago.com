import { NextResponse } from "next/server";
import { partnerPrisma } from "@/services/partner/infrastructure/db/client";

export async function GET() {
  const operators = await partnerPrisma.operator.findMany({
    orderBy: { createdAt: "desc" },
    include: { partner: true },
  });

  return NextResponse.json(
    operators.map((o) => ({
      id: o.id,
      name: o.name,
      email: o.email,
      phone: o.phone ?? undefined,
      status: o.status,
      partner: {
        id: o.partner.id,
        name: o.partner.name,
      },
    })),
  );
}
