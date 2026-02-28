import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await requireAuth();
  const { searchParams } = new URL(request.url);
  const experienceId = searchParams.get('experienceId');
  if (!experienceId) {
    return NextResponse.json({ error: 'experienceId required' }, { status: 400 });
  }
  const slots = await db.slot.findMany({
    where: { experienceId: Number(experienceId) },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(slots);
}

export async function POST(request: NextRequest) {
  await requireAuth();
  const body = await request.json();
  const { experienceId, date, time, capacity } = body;
  if (!experienceId || !date || !time || !capacity) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }
  const slot = await db.slot.create({
    data: {
      experienceId,
      date,
      time,
      capacity,
    },
  });
  return NextResponse.json(slot);
}
