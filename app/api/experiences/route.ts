import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthTokenFromRequest, verifyAuthToken } from '@/lib/auth';

// Only authenticated operators can create/update/delete their experiences
function isOperator(token: any) {
  return token?.role === 'OPERATOR_AGENCY' || token?.role === 'OPERATOR_FREELANCE';
}

export async function GET(request: NextRequest) {
  // List all experiences for authenticated operator
  const token = verifyAuthToken(getAuthTokenFromRequest(request));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  let where = {};
  if (isOperator(token)) {
    where = { operatorId: token.operatorId };
  }
  const experiences = await prisma.experience.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      durationMinutes: true,
      capacity: true,
      image: true,
      coveragePolicy: true,
      coverageDescription: true,
      operatorId: true,
      cityId: true,
      categoryId: true,
      status: true,
      slots: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ experiences });
}

export async function POST(request: NextRequest) {
  const token = verifyAuthToken(getAuthTokenFromRequest(request));
  if (!isOperator(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { title, description, price, durationMinutes, capacity, image, coveragePolicy, coverageDescription, cityId, categoryId } = body;
  if (!title || !price || !durationMinutes || !capacity || !cityId || !categoryId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const experience = await prisma.experience.create({
    data: {
      title,
      description,
      price,
      durationMinutes,
      capacity,
      image,
      coveragePolicy,
      coverageDescription,
      operatorId: token.operatorId,
      cityId,
      categoryId,
      status: 'DRAFT',
    },
  });
  return NextResponse.json({ experience });
}

export async function PUT(request: NextRequest) {
  const token = verifyAuthToken(getAuthTokenFromRequest(request));
  if (!isOperator(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { id, ...updateData } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing experience id' }, { status: 400 });
  }
  // Only allow update if experience belongs to operator
  const experience = await prisma.experience.findUnique({ where: { id } });
  if (!experience || experience.operatorId !== token.operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const updated = await prisma.experience.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json({ experience: updated });
}

export async function DELETE(request: NextRequest) {
  const token = verifyAuthToken(getAuthTokenFromRequest(request));
  if (!isOperator(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing experience id' }, { status: 400 });
  }
  // Only allow delete if experience belongs to operator
  const experience = await prisma.experience.findUnique({ where: { id } });
  if (!experience || experience.operatorId !== token.operatorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  await prisma.experience.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
