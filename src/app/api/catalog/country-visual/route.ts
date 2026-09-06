import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('country') ?? '').toLowerCase();
  if (!code) {
    return NextResponse.json({ hero: [], photoSlider: [], destinations: [] });
  }

  const country = await prisma.country.findFirst({
    where: { domainSlug: code },
    select: { id: true },
  });
  if (!country) {
    return NextResponse.json({ hero: [], photoSlider: [], destinations: [] });
  }

  const slides = await prisma.countrySlide.findMany({
    where: { countryId: country.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { type: true, imageUrl: true, title: true, subtitle: true, emoji: true },
  });

  return NextResponse.json({
    hero: slides
      .filter(s => s.type === 'HERO')
      .map(s => ({ imageUrl: s.imageUrl, title: s.title })),
    photoSlider: slides
      .filter(s => s.type === 'PHOTO_SLIDER')
      .map(s => ({ imageUrl: s.imageUrl, title: s.title, subtitle: s.subtitle ?? '' })),
    destinations: slides
      .filter(s => s.type === 'DESTINATION')
      .map(s => ({ imageUrl: s.imageUrl, title: s.title, emoji: s.emoji ?? '' })),
  });
}
