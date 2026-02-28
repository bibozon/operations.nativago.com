import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthTokenFromRequest, verifyAuthToken } from '@/lib/auth';

// Only SUPERADMIN can create/update/delete operators
function isSuperAdmin(token: any) {
  return token?.role === 'SUPERADMIN';
}

export async function GET(request: NextRequest) {
  // List all operators
  const operators = await prisma.operator.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cityId: true,
      city: { select: { id: true, name: true, country: true } },
      type: true,
      verificationStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ operators });
}

export async function POST(request: NextRequest) {
  const token = verifyAuthToken(getAuthTokenFromRequest(request));
  if (!isSuperAdmin(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { name, email, phone, cityId, type } = body;
  if (!name || !email || !cityId || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const operator = await prisma.operator.create({
    data: { name, email, phone, cityId, type },
  });
  return NextResponse.json({ operator });
}

export async function PUT(request: NextRequest) {
  const token = verifyAuthToken(getAuthTokenFromRequest(request));
  if (!isSuperAdmin(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { id, name, email, phone, cityId, type, verificationStatus } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing operator id' }, { status: 400 });
  }
  const operator = await prisma.operator.update({
    where: { id },
    data: { name, email, phone, cityId, type, verificationStatus },
  });
  return NextResponse.json({ operator });
}

export async function DELETE(request: NextRequest) {
  const token = verifyAuthToken(getAuthTokenFromRequest(request));
  if (!isSuperAdmin(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing operator id' }, { status: 400 });
  }
  await prisma.operator.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
