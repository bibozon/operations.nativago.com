import { NextRequest, NextResponse } from "next/server";
import { getExperienceById } from "@/services/catalog/application/catalogService";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const experience = await getExperienceById(params.id);
  if (!experience) {
    return NextResponse.json({ message: "Experience not found" }, { status: 404 });
  }
  return NextResponse.json(experience);
}
