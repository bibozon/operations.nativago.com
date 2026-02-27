import { NextRequest, NextResponse } from 'next/server';
import { createExperience, updateExperience } from '@/services/catalog/cms';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    title,
    description,
    price,
    durationMinutes,
    image,
    featured,
    categoryId,
    cityId,
    operatorId,
  } = body ?? {};

  if (!title || !description || price == null || !durationMinutes || !categoryId || !cityId || !operatorId) {
    return NextResponse.json(
      { error: 'Missing required fields for experience' },
      { status: 400 }
    );
  }

  const experience = await createExperience({
    title,
    description,
    price: Number(price),
    durationMinutes: Number(durationMinutes),
    image,
    featured: Boolean(featured),
    categoryId: Number(categoryId),
    cityId: Number(cityId),
    operatorId: Number(operatorId),
  });

  return NextResponse.json(experience, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body ?? {};

  const experienceId = Number(id);
  if (!id || Number.isNaN(experienceId)) {
    return NextResponse.json(
      { error: 'Valid id is required for update' },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = { ...rest };

  if (data.price != null) data.price = Number(data.price);
  if (data.durationMinutes != null) data.durationMinutes = Number(data.durationMinutes);
  if (data.categoryId != null) data.categoryId = Number(data.categoryId);
  if (data.cityId != null) data.cityId = Number(data.cityId);
  if (data.operatorId != null) data.operatorId = Number(data.operatorId);

  const updated = await updateExperience(experienceId, data);

  return NextResponse.json(updated);
}
