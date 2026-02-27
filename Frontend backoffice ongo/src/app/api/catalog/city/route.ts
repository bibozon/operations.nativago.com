import { NextRequest, NextResponse } from "next/server";
import { catalogPrisma } from "@/services/catalog/infrastructure/db/client";
import { requireAdmin } from "@/infrastructure/auth/jwt-guard";

export async function POST(req: NextRequest) {
  await requireAdmin(req);
  const body = await req.json();

  const city = await catalogPrisma.city.create({
    data: {
      name: body.name,
      country: body.country,
    },
  });

  return NextResponse.json(city, { status: 201 });
}
