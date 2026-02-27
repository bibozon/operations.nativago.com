import { NextResponse } from "next/server";
import { catalogPrisma } from "@/services/catalog/infrastructure/db/client";

export async function GET() {
  const cities = await catalogPrisma.city.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    cities.map((c) => ({
      id: c.id,
      name: c.name,
      country: c.country,
    })),
  );
}
