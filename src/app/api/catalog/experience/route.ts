import { NextRequest, NextResponse } from 'next/server';
import { createExperience, updateExperience } from '@/services/catalog/cms';
import { getAuthUserFromRequest } from '@/lib/auth';
import { isStaffOrAbove } from '@/lib/requireRole';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  const authUser = getAuthUserFromRequest(request);

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    price,
    durationMinutes,
    image,
    categoryId,
    cityId,
    operatorId,
  } = body ?? {};

  if (
    !title ||
    !description ||
    price == null ||
    !durationMinutes ||
    !categoryId ||
    !cityId ||
    (!operatorId && isStaffOrAbove(authUser.role))
  ) {
    return NextResponse.json(
      { error: 'Missing required fields for experience' },
      { status: 400 }
    );
  }

  const finalOperatorId =
    isStaffOrAbove(authUser.role) ? (operatorId as string) : authUser.operatorId;

  if (!finalOperatorId) {
    return NextResponse.json(
      { error: 'Operator not associated with user' },
      { status: 403 },
    );
  }

  try {
    const experience = await createExperience({
      title,
      description,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      images: image ? [image as string] : [],
      categoryId: (categoryId as string) ?? '',
      cityId: (cityId as string) ?? '',
      operatorId: (finalOperatorId as string) ?? '',
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create experience' },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authUser = getAuthUserFromRequest(request);

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...rest } = body ?? {};

  const experienceId = id;
  if (!experienceId || typeof experienceId !== 'string') {
    return NextResponse.json(
      { error: 'Valid id is required for update' },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = { ...rest };

  if (data.price != null) data.price = Number(data.price);
  if (data.durationMinutes != null) data.durationMinutes = Number(data.durationMinutes);
  if (data.categoryId != null) data.categoryId = String(data.categoryId);
  if (data.cityId != null) data.cityId = String(data.cityId);
  if (data.operatorId != null) data.operatorId = String(data.operatorId);

  if (!isStaffOrAbove(authUser.role)) {
    const existing = await prisma.experience.findUnique({
      where: { id: experienceId },
      select: { operatorId: true },
    });

    if (!existing || !authUser.operatorId || existing.operatorId !== authUser.operatorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const updated = await updateExperience(experienceId, data);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update experience' },
      { status: 400 },
    );
  }
}
