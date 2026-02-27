import { NextRequest, NextResponse } from "next/server";
import { createExperience, listExperiencesForOperator } from "@/application/experience/experienceService";

export async function GET(req: NextRequest) {
  const operatorId = req.nextUrl.searchParams.get("operatorId");
  if (!operatorId) {
    return NextResponse.json({ message: "operatorId required" }, { status: 400 });
  }

  const experiences = await listExperiencesForOperator(operatorId);
  return NextResponse.json(experiences);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

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

  return NextResponse.json(experience, { status: 201 });
}
