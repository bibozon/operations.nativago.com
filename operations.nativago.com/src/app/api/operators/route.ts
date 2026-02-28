import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET() {
  const user = await requireRole('SUPERADMIN');
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const operators = await db.operator.findMany({
    select: { id: true, name: true, email: true }
  });
  return NextResponse.json(operators);
}

export async function POST(request: NextRequest) {
  const user = await requireRole('SUPERADMIN');
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const { name, type, email, phone } = body;
  if (!name || !type || !email || !phone) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
  }
  const operator = await db.operator.create({
    data: { name, type, email, phone },
  });
  return NextResponse.json(operator);
}
