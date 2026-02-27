import { NextResponse } from "next/server";
import { catalogPrisma } from "@/services/catalog/infrastructure/db/client";

export async function GET() {
  const categories = await catalogPrisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? undefined,
    })),
  );
}
