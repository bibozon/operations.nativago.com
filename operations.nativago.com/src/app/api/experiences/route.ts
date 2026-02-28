import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await requireAuth();
  let where = {};
  if (user.role === 'OPERATOR_AGENCY' || user.role === 'OPERATOR_FREELANCE') {
    where = { operatorId: user.operatorId };
  }
  const experiences = await db.experience.findMany({
    where,
    include: {
      operator: { select: { id: true, name: true } },
      city: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(experiences);
}

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  const body = await request.json();
  const {
    title,
    description,
    price,
    durationMinutes,
    capacity,
    images,
    coveragePolicy,
    coverageDescription,
    operatorId,
    cityId,
    categoryId,
  } = body;
  if (!title || !operatorId || !cityId || !categoryId) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }
  const experience = await db.experience.create({
    data: {
      title,
      description,
      price,
      durationMinutes,
      capacity,
      images,
      coveragePolicy,
      coverageDescription,
      operatorId,
      cityId,
      categoryId,
    },
  });
  return NextResponse.json(experience);
}

export async function PATCH(request: NextRequest) {
  const user = await requireAuth();
  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
  }
  const experience = await db.experience.update({
    where: { id },
    data: { status: 'PUBLISHED' },
  });
  return NextResponse.json(experience);
}
