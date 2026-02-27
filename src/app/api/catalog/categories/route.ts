import { NextResponse } from 'next/server';
import { listCategories } from '@/services/catalog/categories';

export async function GET() {
  try {
    const categories = await listCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET /api/catalog/categories failed', error);
    return NextResponse.json(
      { error: 'Failed to load categories' },
      { status: 500 }
    );
  }
}