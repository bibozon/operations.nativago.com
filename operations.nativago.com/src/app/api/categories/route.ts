import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET() {
  await requireRole('SUPERADMIN');
  const categories = await db.category.findMany();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  await requireRole('SUPERADMIN');
  const body = await request.json();
  const { name, icon } = body;
  if (!name || !icon) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
  }
  const category = await db.category.create({ data: { name, icon } });
  return NextResponse.json(category);
}
