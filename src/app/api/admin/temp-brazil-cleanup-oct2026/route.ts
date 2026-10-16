import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Endpoint temporal de un solo uso (auditoria oct2026): limpieza de
// experiencias de prueba en Brasil, dejando solo Arraial do Cabo,
// Armacao dos Buzios y Cabo Frio. Protegido por token fijo. Se elimina
// de este repo en cuanto termine su uso.
const ONE_TIME_TOKEN = 'kQ3mXvD8-pL2wRtY6-jN9cFhZa1b';

const TARGET_CITY_NAMES = ['Arraial do Cabo', 'Armacao dos Buzios', 'Cabo Frio', 'Armação dos Búzios'];

function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const mode = req.nextUrl.searchParams.get('mode') ?? 'plan';

  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const brazil = await prisma.country.findFirst({ where: { code: 'BR' } });
  if (!brazil) {
    return NextResponse.json({ error: 'brazil_not_found' }, { status: 404 });
  }

  const cities = await prisma.city.findMany({
    where: { countryId: brazil.id },
    include: { experiences: true, operators: true },
  });

  const targetNorms = TARGET_CITY_NAMES.map(norm);
  const targetCities = cities.filter((c) => targetNorms.includes(norm(c.name)));
  const otherCities = cities.filter((c) => !targetNorms.includes(norm(c.name)));

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });

  if (mode === 'plan') {
    return NextResponse.json({
      mode: 'plan',
      brazil: { id: brazil.id, code: brazil.code },
      targetCities: targetCities.map((c) => ({
        id: c.id,
        name: c.name,
        experienceCount: c.experiences.length,
        operatorCount: c.operators.length,
      })),
      citiesToClear: otherCities.map((c) => ({
        id: c.id,
        name: c.name,
        experienceCount: c.experiences.length,
        operatorCount: c.operators.length,
      })),
      totalExperiencesToDelete: otherCities.reduce((sum, c) => sum + c.experiences.length, 0),
      categoriesAvailable: categories,
      note: 'Esto es solo un plan (no se borro ni creo nada). Llama con &mode=apply&confirm=YES para ejecutar.',
    });
  }

  if (mode === 'apply') {
    const confirm = req.nextUrl.searchParams.get('confirm');
    if (confirm !== 'YES') {
      return NextResponse.json({ error: 'missing_confirm', hint: 'agrega &confirm=YES' }, { status: 400 });
    }

    const deleteSummary: Record<string, number> = {};

    for (const city of otherCities) {
      const expIds = city.experiences.map((e) => e.id);
      if (expIds.length === 0) continue;

      const reviewsDeleted = await prisma.review.deleteMany({ where: { experienceId: { in: expIds } } });
      const bookingsDeleted = await prisma.booking.deleteMany({ where: { experienceId: { in: expIds } } });
      const availDeleted = await prisma.availabilitySlot.deleteMany({ where: { experienceId: { in: expIds } } });
      const slotsDeleted = await prisma.slot.deleteMany({ where: { experienceId: { in: expIds } } });
      const expDeleted = await prisma.experience.deleteMany({ where: { id: { in: expIds } } });

      deleteSummary[city.name] = expDeleted.count;
      deleteSummary[city.name + '__reviews'] = reviewsDeleted.count;
      deleteSummary[city.name + '__bookings'] = bookingsDeleted.count;
      deleteSummary[city.name + '__availability'] = availDeleted.count;
      deleteSummary[city.name + '__slots'] = slotsDeleted.count;
    }

    const category =
      categories.find((c) => /tour|paseo|excurs/i.test(c.name)) ?? categories[0];

    if (!category) {
      return NextResponse.json(
        { error: 'no_category_available', deleteSummary },
        { status: 500 },
      );
    }

    const createdOperators: Record<string, string> = {};
    const createdExperiences: Array<{ city: string; title: string; id: string }> = [];

    const SEED_DATA: Record<string, Array<{ title: string; description: string; price: number; duration: number }>> = {
      'Arraial do Cabo': [
        {
          title: '[PRUEBA] Passeio de barco pela Prainhas do Pontal',
          description: 'Passeio de prueba (dato ficticio) por las playas y calas de Arraial do Cabo en barco, con paradas para snorkel. Experiencia de prueba creada para el piloto NativaGo, no representa un operador real todavia.',
          price: 180,
          duration: 180,
        },
      ],
      'Armacao dos Buzios': [
        {
          title: '[PRUEBA] City tour pelas praias de Buzios',
          description: 'Recorrido de prueba (dato ficticio) por las playas mas iconicas de Buzios (Geriba, Ferradura, Orla Bardot). Experiencia de prueba creada para el piloto NativaGo, no representa un operador real todavia.',
          price: 150,
          duration: 240,
        },
      ],
      'Armação dos Búzios': [
        {
          title: '[PRUEBA] City tour pelas praias de Buzios',
          description: 'Recorrido de prueba (dato ficticio) por las playas mas iconicas de Buzios (Geriba, Ferradura, Orla Bardot). Experiencia de prueba creada para el piloto NativaGo, no representa un operador real todavia.',
          price: 150,
          duration: 240,
        },
      ],
      'Cabo Frio': [
        {
          title: '[PRUEBA] Passeio as dunas e Lagoa de Araruama',
          description: 'Paseo de prueba (dato ficticio) por las dunas de Cabo Frio y la Laguna de Araruama. Experiencia de prueba creada para el piloto NativaGo, no representa un operador real todavia.',
          price: 120,
          duration: 150,
        },
      ],
    };

    for (const city of targetCities) {
      let operatorId = city.operators[0]?.id;

      if (!operatorId) {
        const slug = norm(city.name).replace(/\s+/g, '-');
        const operator = await prisma.operator.create({
          data: {
            name: '[PRUEBA] Operador de prueba ' + city.name,
            email: 'operador.prueba.' + slug + '@nativago-test.com',
            type: 'AGENCY',
            verificationStatus: 'APPROVED',
            cityId: city.id,
            countryId: brazil.id,
            liabilityAccepted: true,
            liabilityAcceptedAt: new Date(),
            contractAccepted: true,
            contractAcceptedAt: new Date(),
          },
        });
        operatorId = operator.id;
      }
      createdOperators[city.name] = operatorId;

      const seeds = SEED_DATA[city.name] ?? [];
      for (const seed of seeds) {
        const exp = await prisma.experience.create({
          data: {
            title: seed.title,
            description: seed.description,
            price: seed.price,
            durationMinutes: seed.duration,
            capacity: 10,
            images: [],
            status: 'PUBLISHED',
            operatorId,
            cityId: city.id,
            categoryId: category.id,
            countryId: brazil.id,
          },
        });
        createdExperiences.push({ city: city.name, title: exp.title, id: exp.id });
      }
    }

    return NextResponse.json({
      ok: true,
      deleteSummary,
      createdOperators,
      createdExperiences,
      categoryUsed: { id: category.id, name: category.name },
      message: 'Listo. Borra este endpoint ahora.',
    });
  }

  return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
}
