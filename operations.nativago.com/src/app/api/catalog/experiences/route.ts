import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const experiences = await db.experience.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      city: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      operator: { select: { id: true, name: true } },
      slots: true,
    },
    orderBy: { id: 'desc' },
  });
  return NextResponse.json(experiences);
}
