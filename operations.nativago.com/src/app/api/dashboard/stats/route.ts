import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';

export async function GET() {
  await requireSuperAdmin();

  const [operators, experiences, slots, published] = await Promise.all([
    prisma.operator.count(),
    prisma.experience.count(),
    prisma.slot.count(),
    prisma.experience.count({ where: { status: 'PUBLISHED' } }),
  ]);

  return NextResponse.json({
    operators,
    experiences,
    slots,
    published,
  });
}
