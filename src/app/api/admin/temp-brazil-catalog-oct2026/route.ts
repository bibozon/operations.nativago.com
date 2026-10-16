import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Endpoint temporal de un solo uso (auditoria oct2026, round 2): construye
// un catalogo de ejemplo mas completo para las 3 ciudades del piloto --
// 2 operadores por ciudad (reusando los que ya existan) y 5 actividades
// de prueba por categoria (9 categorias) para CADA operador. Protegido
// por token fijo. Se elimina de este repo en cuanto termine su uso.
const ONE_TIME_TOKEN = 'nG7xQpL2-vK9mTzR4-bC6fWjH1';

const TARGET_CITY_NAMES = ['Arraial do Cabo', 'Armação dos Búzios', 'Cabo Frio', 'Armacao dos Buzios'];
const OPERATORS_PER_CITY = 2;

function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

interface TplItem {
  title: string;
  price: number;
  duration: number;
}

const CATEGORY_PLAN: Record<string, TplItem[]> = {
  'paseos-barco': [
    { title: 'Passeio de barco pelas ilhas e enseadas de {city}', price: 180, duration: 180 },
    { title: 'Volta de escuna ao pôr do sol em {city}', price: 150, duration: 120 },
    { title: 'Passeio de lancha rápida pela orla de {city}', price: 220, duration: 90 },
    { title: 'Tour de catamarã com parada para banho em {city}', price: 200, duration: 240 },
    { title: 'Passeio de barco particular - grupos pequenos em {city}', price: 350, duration: 180 },
  ],
  aventura: [
    { title: 'Stand-up paddle nas águas calmas de {city}', price: 90, duration: 90 },
    { title: 'Caiaque pelas enseadas de {city}', price: 100, duration: 120 },
    { title: 'Passeio de buggy pelas trilhas costeiras de {city}', price: 180, duration: 150 },
    { title: 'Voo de parapente com vista para {city}', price: 350, duration: 30 },
    { title: 'Rapel e trilha de aventura nos costões de {city}', price: 160, duration: 180 },
  ],
  cultura: [
    { title: 'Tour histórico pelo centro de {city}', price: 60, duration: 90 },
    { title: 'Visita guiada aos pontos históricos de {city}', price: 70, duration: 120 },
    { title: 'Passeio cultural e gastronômico pelo centro de {city}', price: 110, duration: 150 },
    { title: 'City tour com guia local em {city}', price: 80, duration: 120 },
    { title: 'Roteiro de fotografia pelos points icônicos de {city}', price: 100, duration: 150 },
  ],
  naturaleza: [
    { title: 'Trilha ecológica pelas falésias de {city}', price: 90, duration: 150 },
    { title: 'Observação de aves e fauna marinha em {city}', price: 110, duration: 180 },
    { title: 'Passeio pela reserva natural próxima a {city}', price: 100, duration: 150 },
    { title: 'Caminhada pela mata atlântica ao redor de {city}', price: 85, duration: 120 },
    { title: 'Tour de observação de golfinhos em {city}', price: 160, duration: 120 },
  ],
  gastronomia: [
    { title: 'Tour gastronômico pelos restaurantes de frutos do mar de {city}', price: 150, duration: 180 },
    { title: 'Degustação de culinária local em {city}', price: 90, duration: 90 },
    { title: 'Aula de culinária com pratos típicos de {city}', price: 130, duration: 150 },
    { title: 'Rota de bares e petiscos em {city}', price: 100, duration: 150 },
    { title: 'Jantar especial à beira-mar em {city}', price: 180, duration: 120 },
  ],
  playa: [
    { title: 'Dia de praia com transporte incluso em {city}', price: 70, duration: 240 },
    { title: 'Tour pelas praias mais bonitas de {city}', price: 120, duration: 240 },
    { title: 'Aluguel de espreguiçadeiras e day use em {city}', price: 50, duration: 300 },
    { title: 'Passeio de beach buggy pelas praias de {city}', price: 150, duration: 150 },
    { title: 'Pôr do sol na praia com welcome drink em {city}', price: 90, duration: 120 },
  ],
  senderismo: [
    { title: 'Trilha até o mirante de {city}', price: 70, duration: 150 },
    { title: 'Caminhada guiada pelos costões de {city}', price: 80, duration: 120 },
    { title: 'Trekking leve pelas trilhas de {city}', price: 75, duration: 150 },
    { title: 'Subida ao ponto mais alto de {city}', price: 90, duration: 180 },
    { title: 'Trilha noturna com guia local em {city}', price: 100, duration: 150 },
  ],
  bienestar: [
    { title: 'Sessão de yoga na praia em {city}', price: 80, duration: 60 },
    { title: 'Massagem relaxante com vista para o mar em {city}', price: 150, duration: 60 },
    { title: 'Retiro de bem-estar de um dia em {city}', price: 220, duration: 240 },
    { title: 'Meditação guiada ao nascer do sol em {city}', price: 70, duration: 60 },
    { title: 'Spa day com tratamentos naturais em {city}', price: 200, duration: 120 },
  ],
  buceo: [
    { title: 'Mergulho de batismo nas águas cristalinas de {city}', price: 250, duration: 120 },
    { title: 'Mergulho livre (snorkel) guiado em {city}', price: 120, duration: 90 },
    { title: 'Mergulho em naufrágio próximo a {city}', price: 320, duration: 150 },
    { title: 'Curso introdutório de mergulho em {city}', price: 350, duration: 180 },
    { title: 'Mergulho noturno para experientes em {city}', price: 300, duration: 120 },
  ],
};

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
  const uniqTargetNorms = [...new Set(targetNorms)];
  const targetCities = cities.filter((c) => uniqTargetNorms.includes(norm(c.name)));

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const missingSlugs = Object.keys(CATEGORY_PLAN).filter((slug) => !categoryBySlug.has(slug));
  if (missingSlugs.length > 0) {
    return NextResponse.json({ error: 'missing_categories', missingSlugs, categoriesFound: categories }, { status: 500 });
  }

  if (mode === 'plan') {
    const plan = targetCities.map((city) => {
      const existingOperatorNames = city.operators.map((o) => o.name);
      const operatorsToCreate = Math.max(0, OPERATORS_PER_CITY - city.operators.length);
      const finalOperatorCount = Math.max(city.operators.length, OPERATORS_PER_CITY);
      const activitiesPerOperator = Object.values(CATEGORY_PLAN).reduce((n, arr) => n + arr.length, 0);
      return {
        city: city.name,
        existingOperators: existingOperatorNames,
        existingExperienceCount: city.experiences.length,
        operatorsToCreate,
        finalOperatorCount,
        activitiesPerOperator,
        newActivitiesTotal: finalOperatorCount * activitiesPerOperator,
      };
    });

    return NextResponse.json({
      mode: 'plan',
      categoriesUsed: [...categoryBySlug.keys()],
      plan,
      grandTotalNewActivities: plan.reduce((n, p) => n + p.newActivitiesTotal, 0),
      note: 'Esto es solo un plan (no se creo nada). Llama con &mode=apply&confirm=YES para ejecutar.',
    });
  }

  if (mode === 'apply') {
    const confirm = req.nextUrl.searchParams.get('confirm');
    if (confirm !== 'YES') {
      return NextResponse.json({ error: 'missing_confirm', hint: 'agrega &confirm=YES' }, { status: 400 });
    }

    const result: Array<{
      city: string;
      operators: Array<{ id: string; name: string; wasNew: boolean; activitiesCreated: number }>;
    }> = [];

    for (const city of targetCities) {
      const operatorsForCity: Array<{ id: string; name: string; wasNew: boolean }> = city.operators.map((o) => ({
        id: o.id,
        name: o.name,
        wasNew: false,
      }));

      let nextIndex = operatorsForCity.length + 1;
      while (operatorsForCity.length < OPERATORS_PER_CITY) {
        const slug = norm(city.name).replace(/\s+/g, '-');
        const name = `[PRUEBA] Operador ${nextIndex} de ${city.name}`;
        const operator = await prisma.operator.create({
          data: {
            name,
            email: `operador${nextIndex}.prueba.${slug}@nativago-test.com`,
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
        operatorsForCity.push({ id: operator.id, name: operator.name, wasNew: true });
        nextIndex += 1;
      }

      const cityResult: { city: string; operators: Array<{ id: string; name: string; wasNew: boolean; activitiesCreated: number }> } = {
        city: city.name,
        operators: [],
      };

      for (const op of operatorsForCity) {
        const rows: Array<{
          title: string;
          description: string;
          price: number;
          durationMinutes: number;
          capacity: number;
          images: string[];
          status: 'PUBLISHED';
          operatorId: string;
          cityId: string;
          categoryId: string;
          countryId: string;
        }> = [];

        for (const [slug, items] of Object.entries(CATEGORY_PLAN)) {
          const category = categoryBySlug.get(slug)!;
          for (const item of items) {
            rows.push({
              title: item.title.replace('{city}', city.name),
              description: `Atividade de teste (dado fictício) em ${city.name}, oferecida por ${op.name}. Parte do catálogo de exemplo do piloto NativaGo — Região dos Lagos.`,
              price: item.price,
              durationMinutes: item.duration,
              capacity: 10,
              images: [],
              status: 'PUBLISHED',
              operatorId: op.id,
              cityId: city.id,
              categoryId: category.id,
              countryId: brazil.id,
            });
          }
        }

        // Un solo round-trip por operador (45 filas) en vez de 45 creates
        // individuales -- evita riesgo de timeout de la funcion serverless.
        const { count } = await prisma.experience.createMany({ data: rows });
        cityResult.operators.push({ id: op.id, name: op.name, wasNew: op.wasNew, activitiesCreated: count });
      }

      result.push(cityResult);
    }

    return NextResponse.json({
      ok: true,
      result,
      message: 'Listo. Borra este endpoint ahora.',
    });
  }

  return NextResponse.json({ error: 'invalid_mode' }, { status: 400 });
}
