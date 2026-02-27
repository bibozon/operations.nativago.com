import { NextResponse } from 'next/server';
import { createCategory } from '@/services/catalog/cms';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug } = body ?? {};

  if (!name || !slug) {
    return NextResponse.json(
      { error: 'name and slug are required' },
      { status: 400 }
    );
  }

  const category = await createCategory({ name, slug });
  return NextResponse.json(category, { status: 201 });
}
