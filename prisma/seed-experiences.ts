import { PrismaClient, ExperienceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo experiences for NativaGo marketplace...');

  // ── 1. Currency ──────────────────────────────────────────────────────────────
  const cop = await prisma.currency.upsert({
    where: { code: 'COP' },
    update: {},
    create: { code: 'COP', symbol: '$', decimalDigits: 0 },
  });

  // ── 2. Language ───────────────────────────────────────────────────────────────
  const es = await prisma.language.upsert({
    where: { code: 'es' },
    update: {},
    create: { code: 'es', name: 'Español' },
  });

  // ── 3. Timezone ───────────────────────────────────────────────────────────────
  const tz = await prisma.timezone.upsert({
    where: { ianaName: 'America/Bogota' },
    update: {},
    create: { ianaName: 'America/Bogota', label: 'COT (UTC-5)' },
  });

  // ── 4. Country ────────────────────────────────────────────────────────────────
  const co = await prisma.country.upsert({
    where: { code: 'CO' },
    update: {},
    create: {
      code: 'CO',
      name: 'Colombia',
      domainSlug: 'co',
      defaultCurrencyId: cop.id,
      defaultLanguageId: es.id,
      timezoneId: tz.id,
      taxRatePercent: 0,
      commissionPercent: 15,
      isActive: true,
    },
  });
  console.log('✓ Country: Colombia (CO)');

  // ── 5. Categories ─────────────────────────────────────────────────────────────
  const cats = [
    { name: 'Buceo',       slug: 'buceo' },
    { name: 'Aventura',    slug: 'aventura' },
    { name: 'Naturaleza',  slug: 'naturaleza' },
    { name: 'Senderismo',  slug: 'senderismo' },
    { name: 'Gastronomía', slug: 'gastronomia' },
    { name: 'Playa',       slug: 'playa' },
    { name: 'Cultura',     slug: 'cultura' },
    { name: 'Bienestar',   slug: 'bienestar' },
  ];
  const catMap: Record<string, string> = {};
  for (const c of cats) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { name: c.name, slug: c.slug },
    });
    catMap[c.slug] = cat.id;
  }
  console.log(`✓ ${cats.length} categories`);

  // ── 6. Cities ─────────────────────────────────────────────────────────────────
  const cities = [
    { name: 'Santa Marta',  country: 'Colombia' },
    { name: 'Cartagena',    country: 'Colombia' },
    { name: 'San Andrés',   country: 'Colombia' },
    { name: 'Medellín',     country: 'Colombia' },
    { name: 'Bogotá',       country: 'Colombia' },
    { name: 'Tayrona',      country: 'Colombia' },
  ];
  const cityMap: Record<string, string> = {};
  for (const c of cities) {
    const city = await prisma.city.upsert({
      where: { id: `city-${c.name.toLowerCase().replace(/\s/g, '-')}` },
      update: { name: c.name, country: c.country, countryId: co.id },
      create: {
        id: `city-${c.name.toLowerCase().replace(/\s/g, '-')}`,
        name: c.name,
        country: c.country,
        countryId: co.id,
      },
    });
    cityMap[c.name] = city.id;
  }
  console.log(`✓ ${cities.length} cities`);

  // ── 7. Demo operator user + operator ─────────────────────────────────────────
  const hashed = await bcrypt.hash('Operador2025!', 10);
  const opUser = await prisma.user.upsert({
    where: { email: 'operador.demo@nativago.com' },
    update: {},
    create: {
      email: 'operador.demo@nativago.com',
      password: hashed,
      name: 'Operador Demo NativaGo',
      role: 'OPERATOR_AGENCY',
    },
  });

  const operator = await prisma.operator.upsert({
    where: { email: 'operador.demo@nativago.com' },
    update: {},
    create: {
      name: 'NativaGo Demo Tours',
      email: 'operador.demo@nativago.com',
      phone: '+57 300 123 4567',
      type: 'AGENCY',
      verificationStatus: 'APPROVED',
      cityId: cityMap['Santa Marta'],
      countryId: co.id,
      userId: opUser.id,
      liabilityAccepted: true,
      contractAccepted: true,
    },
  });

  // Ensure OperatorMember link
  await prisma.operatorMember.upsert({
    where: { operatorId_userId: { operatorId: operator.id, userId: opUser.id } },
    update: {},
    create: { operatorId: operator.id, userId: opUser.id, role: 'ADMIN' },
  });
  console.log('✓ Demo operator: NativaGo Demo Tours');

  // ── 8. Experiences ────────────────────────────────────────────────────────────
  const IMG_BASE = 'https://images.unsplash.com';
  const experiences = [
    {
      id: 'exp-buceo-basico-santa-marta',
      title: 'Buceo guiado en Santa Marta — Básico',
      description: 'Sumérgete en las aguas cristalinas de Santa Marta con nuestro instructor certificado. Ideal para principiantes. Incluye equipo completo y briefing de seguridad.',
      price: 45000,
      durationMinutes: 60,
      capacity: 8,
      images: [`${IMG_BASE}/photo-1559827260-dc66d52bef19?w=800`],
      categoryId: catMap['buceo'],
      cityId: cityMap['Santa Marta'],
    },
    {
      id: 'exp-buceo-estandar-santa-marta',
      title: 'Buceo guiado en Santa Marta — Estándar',
      description: 'Experiencia de buceo de 2 horas con dos inmersiones. Visita arrecifes de coral y vida marina abundante. Para buceadores con experiencia básica previa.',
      price: 90000,
      durationMinutes: 120,
      capacity: 6,
      images: [`${IMG_BASE}/photo-1544551763-46a013bb70d5?w=800`],
      categoryId: catMap['buceo'],
      cityId: cityMap['Santa Marta'],
    },
    {
      id: 'exp-buceo-plus-santa-marta',
      title: 'Buceo guiado en Santa Marta — Plus',
      description: 'Pack avanzado con 3 inmersiones, fotografía subacuática incluida y guía personalizado. Acceso a zonas exclusivas del Parque Tayrona submarino.',
      price: 150000,
      durationMinutes: 180,
      capacity: 4,
      images: [`${IMG_BASE}/photo-1601879033979-1e2e9f8a2b3c?w=800`],
      categoryId: catMap['buceo'],
      cityId: cityMap['Santa Marta'],
    },
    {
      id: 'exp-buceo-premium-santa-marta',
      title: 'Buceo guiado en Santa Marta — Premium',
      description: 'La experiencia máxima: 4 horas, 4 inmersiones, video HD, transfer incluido y almuerzo típico costeño. Cupos limitados para máxima personalización.',
      price: 320000,
      durationMinutes: 240,
      capacity: 2,
      images: [`${IMG_BASE}/photo-1574144664822-a750bc0e0f13?w=800`],
      categoryId: catMap['buceo'],
      cityId: cityMap['Santa Marta'],
    },
    {
      id: 'exp-senderismo-tayrona',
      title: 'Senderismo en el Parque Tayrona',
      description: 'Recorre los senderos míticos del Parque Nacional Tayrona hasta la playa Cabo San Juan. Guía local experto en flora y fauna del Caribe colombiano.',
      price: 120000,
      durationMinutes: 300,
      capacity: 12,
      images: [`${IMG_BASE}/photo-1533240332313-0db49b459ad6?w=800`],
      categoryId: catMap['senderismo'],
      cityId: cityMap['Tayrona'],
    },
    {
      id: 'exp-snorkeling-san-andres',
      title: 'Snorkel en el Mar de los 7 Colores',
      description: 'Explora el famoso "Mar de los 7 Colores" de San Andrés en kayak transparente y snorkel. Visita Johnny Cay y la Piscinita Natural.',
      price: 85000,
      durationMinutes: 180,
      capacity: 10,
      images: [`${IMG_BASE}/photo-1505118380757-91f5f5632de0?w=800`],
      categoryId: catMap['playa'],
      cityId: cityMap['San Andrés'],
    },
    {
      id: 'exp-city-tour-cartagena',
      title: 'City Tour Amurallado de Cartagena',
      description: 'Recorre las calles de la Ciudad Amurallada con un guía certificado. Historia, arquitectura colonial, leyendas y los mejores spots fotográficos.',
      price: 65000,
      durationMinutes: 150,
      capacity: 15,
      images: [`${IMG_BASE}/photo-1558618666-fcd25c85cd64?w=800`],
      categoryId: catMap['cultura'],
      cityId: cityMap['Cartagena'],
    },
    {
      id: 'exp-gastronomia-cartagena',
      title: 'Tour gastronómico en Santa Marta',
      description: 'Prueba los sabores del Caribe en 5 paradas gastronómicas seleccionadas: ceviches, patacones, jugos tropicales y dulces típicos de la región.',
      price: 95000,
      durationMinutes: 180,
      capacity: 8,
      images: [`${IMG_BASE}/photo-1504674900247-0877df9cc836?w=800`],
      categoryId: catMap['gastronomia'],
      cityId: cityMap['Santa Marta'],
    },
    {
      id: 'exp-parapente-medellin',
      title: 'Parapente sobre Medellín',
      description: 'Vuelo en parapente biplaza desde las montañas de El Poblado con vistas panorámicas de toda la ciudad. Incluye fotos y video del vuelo.',
      price: 180000,
      durationMinutes: 45,
      capacity: 4,
      images: [`${IMG_BASE}/photo-1523712999610-f77fbcfc3843?w=800`],
      categoryId: catMap['aventura'],
      cityId: cityMap['Medellín'],
    },
    {
      id: 'exp-ciclismo-bogota',
      title: 'Ciclovía y naturaleza en Bogotá',
      description: 'Recorre los Cerros Orientales de Bogotá en bicicleta de montaña. Tour guiado con paradas en miradores, flora andina y café de altura.',
      price: 75000,
      durationMinutes: 240,
      capacity: 10,
      images: [`${IMG_BASE}/photo-1558618047-3c8c76ca7d13?w=800`],
      categoryId: catMap['naturaleza'],
      cityId: cityMap['Bogotá'],
    },
  ];

  let created = 0;
  for (const exp of experiences) {
    await prisma.experience.upsert({
      where: { id: exp.id },
      update: {
        title: exp.title,
        description: exp.description,
        price: exp.price,
        durationMinutes: exp.durationMinutes,
        capacity: exp.capacity,
        images: exp.images,
        status: ExperienceStatus.PUBLISHED,
      },
      create: {
        id: exp.id,
        title: exp.title,
        description: exp.description,
        price: exp.price,
        durationMinutes: exp.durationMinutes,
        capacity: exp.capacity,
        images: exp.images,
        categoryId: exp.categoryId,
        cityId: exp.cityId,
        operatorId: operator.id,
        countryId: co.id,
        status: ExperienceStatus.PUBLISHED,
      },
    });
    created++;
    console.log(`  ✓ ${exp.title}`);
  }

  console.log(`\nSeed completo: ${created} experiencias creadas/actualizadas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
