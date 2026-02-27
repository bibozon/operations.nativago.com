import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/client";
import { createExperience } from "@/application/experience/experienceService";

// Shape que usa el front en src/lib/servicesApi.ts
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
    // De momento todas las experiencias se consideran activas
    active: true,
  };
}

export async function GET(req: NextRequest) {
  const operatorId = req.nextUrl.searchParams.get("operatorId");

  const experiences = await prisma.experience.findMany({
    where: operatorId ? { operatorId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { city: true },
  });

  const services = experiences.map(mapExperienceToService);
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Soportamos el payload simple del backoffice (name, description, city, price, active)
  // y lo mapeamos al dominio Experience.
  if (body.name) {
    const operator = await prisma.operator.findFirst({
      include: { user: true },
    });

    if (!operator) {
      return NextResponse.json({ message: "No hay operador configurado para crear experiencias" }, { status: 400 });
    }

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

    const experience = await createExperience({
      operatorId: operator.id,
      agencyId: operator.user.agencyId ?? undefined,
      title: body.name,
      description: body.description ?? "",
      cityId,
      categoryId: undefined,
      durationMinutes: body.durationMinutes ?? 120,
      price: body.price ?? 0,
      coveragePolicy: "COVERAGE_85_15",
      coverageDescription: "Operador 85% / NativaGo 15% (offline).",
      photos: body.photos ?? [],
    });

    const withCity = await prisma.experience.findUnique({
      where: { id: experience.id },
      include: { city: true },
    });

    return NextResponse.json(mapExperienceToService(withCity!), { status: 201 });
  }

  // Fallback: si llega el payload completo del dominio, lo pasamos tal cual.
  const experience = await createExperience({
    operatorId: body.operatorId,
    agencyId: body.agencyId,
    title: body.title,
    description: body.description,
    cityId: body.cityId,
    categoryId: body.categoryId,
    durationMinutes: body.durationMinutes,
    price: body.price,
    coveragePolicy: body.coveragePolicy,
    coverageDescription: body.coverageDescription,
    photos: body.photos ?? [],
  });

  const withCity = await prisma.experience.findUnique({
    where: { id: experience.id },
    include: { city: true },
  });

  return NextResponse.json(mapExperienceToService(withCity!), { status: 201 });
}
