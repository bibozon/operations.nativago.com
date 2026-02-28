import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRemainingCapacity } from '@/lib/availability';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const experienceId = searchParams.get('experienceId');
  if (!experienceId) {
    return NextResponse.json({ error: 'experienceId requerido' }, { status: 400 });
  }

  // Verificar que la experiencia está publicada
  const experience = await db.experience.findUnique({
    where: { id: Number(experienceId), status: 'PUBLISHED' },
  });
  if (!experience) {
    return NextResponse.json({ error: 'Experiencia no publicada' }, { status: 404 });
  }

  // Slots futuros
  const today = new Date().toISOString().slice(0, 10);
  const slots = await db.slot.findMany({
    where: {
      experienceId: Number(experienceId),
      date: { gte: today },
    },
    orderBy: { date: 'asc' },
  });

  // Calcular disponibilidad real
  const result = await Promise.all(slots.map(async slot => ({
    date: slot.date,
    time: slot.time,
    remainingCapacity: await getRemainingCapacity(slot.id),
  })));

  return NextResponse.json(result);
}
