import { NextRequest, NextResponse } from "next/server";
import { getExperienceById, listExperiences } from "@/services/catalog/application/catalogService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const experience = await getExperienceById(id);
    if (!experience) {
      return NextResponse.json({ message: "Experience not found" }, { status: 404 });
    }
    return NextResponse.json(experience);
  }

  const experiences = await listExperiences();
  return NextResponse.json(experiences);
}
