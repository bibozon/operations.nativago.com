import { NextRequest, NextResponse } from "next/server";
import { catalogPrisma } from "@/services/catalog/infrastructure/db/client";
import { requireAdminOrPartner } from "@/infrastructure/auth/jwt-guard";

export async function POST(req: NextRequest) {
  await requireAdminOrPartner(req);
  const body = await req.json();

  const experience = await catalogPrisma.experience.findUnique({ where: { id: body.experienceId } });
  if (!experience) {
    return NextResponse.json({ message: "Experience not found" }, { status: 400 });
  }

  if (body.capacity <= 0) {
    return NextResponse.json({ message: "capacity must be greater than 0" }, { status: 400 });
  }

  const slot = await catalogPrisma.experienceSlot.create({
    data: {
      experienceId: body.experienceId,
      date: new Date(body.date),
      startTime: new Date(body.startTime),
      capacity: body.capacity,
    },
  });

  return NextResponse.json(slot, { status: 201 });
}
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
