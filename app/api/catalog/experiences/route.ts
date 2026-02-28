import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Public API: only returns published experiences
export async function GET(request: NextRequest) {
  const experiences = await prisma.experience.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      durationMinutes: true,
      capacity: true,
      images: true,
      coveragePolicy: true,
      coverageDescription: true,
      operator: { select: { id: true, name: true } },
      city: { select: { id: true, name: true, country: true } },
      category: { select: { id: true, name: true, slug: true } },
      slots: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ experiences });
}
