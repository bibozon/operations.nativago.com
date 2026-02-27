import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateExperience } from "@/services/catalog/application/catalogService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const experience = await createOrUpdateExperience({
      partnerId: body.partnerId,
      title: body.title,
      description: body.description,
      durationMinutes: body.durationMinutes,
      price: body.price,
      cityId: body.cityId,
      categoryId: body.categoryId,
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Error creating experience" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ message: "id is required" }, { status: 400 });
  }

  try {
    const experience = await createOrUpdateExperience({
      id: body.id,
      partnerId: body.partnerId,
      title: body.title,
      description: body.description,
      durationMinutes: body.durationMinutes,
      price: body.price,
      cityId: body.cityId,
      categoryId: body.categoryId,
    });

    return NextResponse.json(experience);
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Error updating experience" }, { status: 400 });
  }
}
