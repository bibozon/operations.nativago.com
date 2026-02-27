import { NextResponse } from 'next/server';
import { createOperator } from '@/services/catalog/cms';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, cityId } = body ?? {};

  if (!name || !email || !cityId) {
    return NextResponse.json(
      { error: 'name, email and cityId are required' },
      { status: 400 }
    );
  }

  const operator = await createOperator({ name, email, phone, cityId: Number(cityId) });
  return NextResponse.json(operator, { status: 201 });
}
