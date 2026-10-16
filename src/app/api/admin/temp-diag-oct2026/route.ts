import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Endpoint temporal de un solo uso (auditoria oct2026, round 3): diagnostico
// de solo lectura para entender por que el home del Marketplace muestra
// imagenes/ciudad equivocadas en el hero y el slider, y si las actividades
// de las 3 ciudades del piloto son visibles. No modifica nada. Protegido
// por token fijo. Se elimina de este repo en cuanto termine su uso.
const ONE_TIME_TOKEN = 'rT4wXpZ9-mK2vBqL7-hC5nSjY3a';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const brazil = await prisma.country.findFirst({ where: { code: 'BR' } });
  if (!brazil) {
    return NextResponse.json({ error: 'brazil_not_found' }, { status: 404 });
  }

  const slides = await prisma.countrySlide.findMany({
    where: { countryId: brazil.id },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    select: {
      id: true,
      type: true,
      title: true,
      subtitle: true,
      imageUrl: true,
      emoji: true,
      isActive: true,
      sortOrder: true,
    },
  });

  const cities = await prisma.city.findMany({
    where: { countryId: brazil.id },
    select: {
      id: true,
      name: true,
      experiences: {
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, status: true },
      },
    },
  });

  return NextResponse.json({
    country: { id: brazil.id, code: brazil.code, domainSlug: brazil.domainSlug },
    countrySlides: slides,
    citiesWithPublishedExperiences: cities.map((c) => ({
      city: c.name,
      publishedCount: c.experiences.length,
    })),
  });
}
