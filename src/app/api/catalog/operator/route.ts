import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createOperator } from '@/services/catalog/cms';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authUser = getAuthUserFromRequest(request);

  // Public (unauthenticated) access: list all operators (for now)
  if (!authUser) {
    const operators = await prisma.operator.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(operators);
  }

  // SUPERADMIN: see all operators
  if (authUser.role === 'SUPERADMIN') {
    const operators = await prisma.operator.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(operators);
  }

  // OPERATOR_*: see only own operator
  if (!authUser.operatorId) {
    return NextResponse.json([], { status: 200 });
  }

  const ownOperator = await prisma.operator.findMany({
    where: { id: authUser.operatorId },
    select: { id: true, name: true },
  });

  return NextResponse.json(ownOperator);
}

export async function POST(request: NextRequest) {
  const authUser = getAuthUserFromRequest(request);

  if (!authUser || authUser.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, phone, cityId } = body ?? {};

  if (!name || !email || !cityId) {
    return NextResponse.json(
      { error: 'name, email and cityId are required' },
      { status: 400 },
    );
  }

  const operator = await createOperator({ name, email, phone, cityId: String(cityId) });
  return NextResponse.json(operator, { status: 201 });
}

