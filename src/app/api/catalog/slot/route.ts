import { NextResponse } from 'next/server';
import { createSlot } from '@/services/catalog/cms';

export async function POST(request: Request) {
  const body = await request.json();
  const { experienceId, date, startTime, capacity } = body ?? {};

  if (!experienceId || !date || !startTime || !capacity) {
    return NextResponse.json(
      { error: 'experienceId, date, startTime and capacity are required' },
      { status: 400 }
    );
  }

  const dateObj = new Date(date);
  const startTimeObj = new Date(startTime);

  if (Number.isNaN(dateObj.getTime()) || Number.isNaN(startTimeObj.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date or startTime format' },
      { status: 400 }
    );
  }

  const slot = await createSlot({
    experienceId: Number(experienceId),
    date: dateObj,
    startTime: startTimeObj,
    capacity: Number(capacity),
  });

  return NextResponse.json(slot, { status: 201 });
}
