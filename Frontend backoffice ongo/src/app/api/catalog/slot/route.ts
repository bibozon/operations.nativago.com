import { NextRequest, NextResponse } from "next/server";
import { createSlot } from "@/services/catalog/application/catalogService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const slot = await createSlot({
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
