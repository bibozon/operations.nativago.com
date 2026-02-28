import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const expId = req.nextUrl.searchParams.get('experienceId');
  if (!expId || typeof expId !== 'string') {
    return NextResponse.json({ error: 'Invalid experienceId' }, { status: 400 });
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: { experienceId: expId },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(slots);
}
