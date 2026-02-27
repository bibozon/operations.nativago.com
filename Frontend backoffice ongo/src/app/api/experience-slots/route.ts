import { NextRequest, NextResponse } from "next/server";
import { createExperienceSlot, listSlotsForExperience } from "@/application/slot/experienceSlotService";

export async function GET(req: NextRequest) {
  const experienceId = req.nextUrl.searchParams.get("experienceId");
  if (!experienceId) {
    return NextResponse.json({ message: "experienceId required" }, { status: 400 });
  }

  const slots = await listSlotsForExperience(experienceId);
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const slot = await createExperienceSlot({
      experienceId: body.experienceId,
      date: body.date,
      startTime: body.startTime,
      capacity: body.capacity,
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Error creating slot" }, { status: 400 });
  }
}
