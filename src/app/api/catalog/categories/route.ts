import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ok: true, categories });
  } catch (error) {
    console.error('GET /api/catalog/categories failed', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Prisma query failed',
        message: String(error),
      },
      { status: 500 },
    );
  }
}