import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthTokenFromRequest, verifyAuthToken } from '@/lib/auth';
import { requireAuth } from "@/lib/require-auth";

function isOperator(token: any) {
  return token?.role === 'OPERATOR_AGENCY' || token?.role === 'OPERATOR_FREELANCE';
}

export async function GET(request: NextRequest) {
  // List all slots for authenticated operator
  const token = requireAuth(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let where = {};
  if (isOperator(token)) {
    where = { experience: { operatorId: token.operatorId } };
  }
  const slots = await prisma.availabilitySlot.findMany({
    where,
    select: {
      id: true,
      experienceId: true,
      date: true,
      startTime: true,
      capacity: true,
      experience: { select: { id: true, title: true } },
    },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json({ slots });
}

export async function POST(request: NextRequest) {
  const token = requireAuth(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isOperator(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { experienceId, date, startTime, capacity } = body;
  if (!experienceId || !date || !startTime || !capacity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Only allow create if experience belongs to operator
  const experience = await prisma.experience.findUnique({ where: { id: experienceId } });
  if (!experience || experience.operatorId !== token.operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const slot = await prisma.availabilitySlot.create({
    data: { experienceId, date, startTime, capacity },
  });
  return NextResponse.json({ slot });
}

export async function PUT(request: NextRequest) {
  const token = requireAuth(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isOperator(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { id, ...updateData } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing slot id' }, { status: 400 });
  }
  // Only allow update if slot belongs to operator
  const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
  }
  const experience = await prisma.experience.findUnique({ where: { id: slot.experienceId } });
  if (!experience || experience.operatorId !== token.operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const updated = await prisma.availabilitySlot.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json({ slot: updated });
}

export async function DELETE(request: NextRequest) {
  const token = requireAuth(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isOperator(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing slot id' }, { status: 400 });
  }
  // Only allow delete if slot belongs to operator
  const slot = await prisma.availabilitySlot.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
  }
  const experience = await prisma.experience.findUnique({ where: { id: slot.experienceId } });
  if (!experience || experience.operatorId !== token.operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  await prisma.availabilitySlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
