import { NextResponse } from 'next/server';
import { createCity } from '@/services/catalog/cms';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, country } = body ?? {};

  if (!name || !country) {
    return NextResponse.json(
      { error: 'name and country are required' },
      { status: 400 }
    );
  }

  const city = await createCity({ name, country });
  return NextResponse.json(city, { status: 201 });
}
