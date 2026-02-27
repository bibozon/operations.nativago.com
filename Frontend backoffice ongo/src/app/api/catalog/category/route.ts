import { NextRequest, NextResponse } from "next/server";
import { catalogPrisma } from "@/services/catalog/infrastructure/db/client";
import { requireAdmin } from "@/infrastructure/auth/jwt-guard";

export async function POST(req: NextRequest) {
  await requireAdmin(req);
  const body = await req.json();

  const category = await catalogPrisma.category.create({
    data: {
      name: body.name,
      description: body.description ?? null,
    },
  });

  return NextResponse.json(category, { status: 201 });
}
