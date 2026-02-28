import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const categories = await prisma.category.findMany();

    return NextResponse.json({
      ok: true,
      categories,
    });
  } catch (error) {
    // Temporary debug logging for Neon / Prisma issues
    console.error('GET /api/debug/db failed', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to query database',
        message,
      },
      { status: 500 },
    );
  }
}
