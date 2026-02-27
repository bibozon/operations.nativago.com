import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/client";

// Reutilizamos el mismo DTO que en route.ts
interface ServiceDto {
  id: string;
  name: string;
  description?: string;
  city?: string;
  price?: number;
  active: boolean;
}

function mapExperienceToService(exp: any): ServiceDto {
  return {
    id: exp.id,
    name: exp.title,
    description: exp.description,
    city: exp.city ? exp.city.name : undefined,
    price: exp.price ? Number(exp.price) : undefined,
    active: true,
  };
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  let cityId: string | undefined;
  if (body.city) {
    const city = await prisma.city.upsert({
      where: { name: body.city },
      update: {},
      create: {
        name: body.city,
        country: "Demo",
      },
    });
    cityId = city.id;
  }

  const updated = await prisma.experience.update({
    where: { id },
    data: {
      title: body.name ?? undefined,
      description: body.description ?? undefined,
      price: body.price ?? undefined,
      cityId,
    },
    include: { city: true },
  });

  return NextResponse.json(mapExperienceToService(updated));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  await prisma.experience.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
