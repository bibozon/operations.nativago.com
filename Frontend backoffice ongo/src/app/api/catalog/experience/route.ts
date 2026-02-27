import { NextRequest, NextResponse } from "next/server";
import { catalogPrisma } from "@/services/catalog/infrastructure/db/client";
import { requireAdminOrPartner } from "@/infrastructure/auth/jwt-guard";

export async function POST(req: NextRequest) {
  const user = await requireAdminOrPartner(req);
  const body = await req.json();

  if (!body.categoryId || !body.cityId || !body.partnerId) {
    return NextResponse.json({ message: "categoryId, cityId and partnerId are required" }, { status: 400 });
  }

  const category = await catalogPrisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 400 });
  }

  const city = await catalogPrisma.city.findUnique({ where: { id: body.cityId } });
  if (!city) {
    return NextResponse.json({ message: "City not found" }, { status: 400 });
  }

  const experience = await catalogPrisma.experience.create({
    data: {
      partnerId: body.partnerId,
      title: body.title,
      description: body.description,
      durationMinutes: body.durationMinutes,
      price: body.price,
      cityId: body.cityId,
      categoryId: body.categoryId,
    },
  });

  return NextResponse.json(experience, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await requireAdminOrPartner(req);
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  const existing = await catalogPrisma.experience.findUnique({ where: { id: body.id } });
  if (!existing) {
    return NextResponse.json({ message: "Experience not found" }, { status: 404 });
  }

  const experience = await catalogPrisma.experience.update({
    where: { id: body.id },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      durationMinutes: body.durationMinutes ?? undefined,
      price: body.price ?? undefined,
      cityId: body.cityId ?? undefined,
      categoryId: body.categoryId ?? undefined,
    },
  });

  return NextResponse.json(experience);
}
