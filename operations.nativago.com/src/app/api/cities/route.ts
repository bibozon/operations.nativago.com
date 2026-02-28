import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET() {
  await requireRole('SUPERADMIN');
  const cities = await db.city.findMany();
  return NextResponse.json(cities);
}

export async function POST(request: NextRequest) {
  await requireRole('SUPERADMIN');
  const body = await request.json();
  const { name, country } = body;
  if (!name || !country) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
  }
  const city = await db.city.create({ data: { name, country } });
  return NextResponse.json(city);
}
