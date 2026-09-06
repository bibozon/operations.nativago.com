import { PrismaClient, ExperienceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo experiences for NativaGo México...');

  // ── 1. Currency ──────────────────────────────────────────────────────────────
  const mxn = await prisma.currency.upsert({
    where: { code: 'MXN' },
    update: {},
    create: { code: 'MXN', symbol: 'MX$', decimalDigits: 2 },
  });

  // ── 2. Language ───────────────────────────────────────────────────────────────
  const es = await prisma.language.upsert({
    where: { code: 'es' },
    update: {},
    create: { code: 'es', name: 'Español' },
  });

  // ── 3. Timezone ───────────────────────────────────────────────────────────────
  const tz = await prisma.timezone.upsert({
    where: { ianaName: 'America/Mexico_City' },
    update: {},
    create: { ianaName: 'America/Mexico_City', label: 'CST (UTC-6)' },
  });

  // ── 4. Country ────────────────────────────────────────────────────────────────
  const mx = await prisma.country.upsert({
    where: { code: 'MX' },
    update: {},
    create: {
      code: 'MX',
      name: 'México',
      domainSlug: 'mx',
      defaultCurrencyId: mxn.id,
      defaultLanguageId: es.id,
      timezoneId: tz.id,
      taxRatePercent: 16,
      commissionPercent: 15,
      isActive: true,
    },
  });
  console.log('✓ Country: México (MX)');

  // ── 5. Categories ─────────────────────────────────────────────────────────────
  const cats = [
    { name: 'Aventura',    slug: 'aventura' },
    { name: 'Cultura',     slug: 'cultura' },
    { name: 'Naturaleza',  slug: 'naturaleza' },
    { name: 'Gastronomía', slug: 'gastronomia' },
    { name: 'Playa',       slug: 'playa' },
    { name: 'Senderismo',  slug: 'senderismo' },
    { name: 'Bienestar',   slug: 'bienestar' },
    { name: 'Buceo',       slug: 'buceo' },
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
    { name: 'Ciudad de México', country: 'México' },
    { name: 'Cancún',           country: 'México' },
    { name: 'Tulum',            country: 'México' },
    { name: 'Oaxaca',           country: 'México' },
    { name: 'Guadalajara',      country: 'México' },
    { name: 'San Miguel de Allende', country: 'México' },
  ];
  const cityMap: Record<string, string> = {};
  for (const c of cities) {
    const city = await prisma.city.upsert({
      where: { id: `city-mx-${c.name.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '')}` },
      update: { name: c.name, country: c.country, countryId: mx.id },
      create: {
        id: `city-mx-${c.name.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '')}`,
        name: c.name,
        country: c.country,
        countryId: mx.id,
      },
    });
    cityMap[c.name] = city.id;
  }
  console.log(`✓ ${cities.length} cities`);

  // ── 7. Demo operator user + operator ─────────────────────────────────────────
  const hashed = await bcrypt.hash('Operador2025!', 10);
  const opUser = await prisma.user.upsert({
    where: { email: 'operador.demo.mx@nativago.com' },
    update: {},
    create: {
      email: 'operador.demo.mx@nativago.com',
      password: hashed,
      name: 'Operador Demo NativaGo México',
      role: 'OPERATOR_AGENCY',
    },
  });

  const operator = await prisma.operator.upsert({
    where: { email: 'operador.demo.mx@nativago.com' },
    update: {},
    create: {
      name: 'NativaGo Demo México',
      email: 'operador.demo.mx@nativago.com',
      phone: '+52 55 1234 5678',
      type: 'AGENCY',
      verificationStatus: 'APPROVED',
      cityId: cityMap['Ciudad de México'],
      countryId: mx.id,
      userId: opUser.id,
      liabilityAccepted: true,
      contractAccepted: true,
    },
  });

  await prisma.operatorMember.upsert({
    where: { operatorId_userId: { operatorId: operator.id, userId: opUser.id } },
    update: {},
    create: { operatorId: operator.id, userId: opUser.id, role: 'ADMIN' },
  });
  console.log('✓ Demo operator: NativaGo Demo México');

  // ── 8. Experiences ────────────────────────────────────────────────────────────
  const IMG = 'https://images.unsplash.com';
  const experiences = [
    {
      id: 'exp-mx-cenote-tulum-basico',
      title: 'Cenote en Tulum — Snorkel Básico',
      description: 'Sumérgete en las aguas turquesa de los cenotes más icónicos de Tulum. Equipo de snorkel incluido, guía certificado y explicación sobre la formación geológica maya.',
      price: 650,
      durationMinutes: 120,
      capacity: 10,
      images: [`${IMG}/photo-1560258018-c7db7645254e?w=800`],
      categoryId: catMap['playa'],
      cityId: cityMap['Tulum'],
    },
    {
      id: 'exp-mx-cenote-tulum-buceo',
      title: 'Buceo en Cenotes de Tulum',
      description: 'Inmersión guiada en el sistema de cuevas subacuáticas de Tulum, uno de los mejores del mundo. Incluye equipo completo, dos inmersiones y fotos submarinas.',
      price: 1800,
      durationMinutes: 180,
      capacity: 4,
      images: [`${IMG}/photo-1559827260-dc66d52bef19?w=800`],
      categoryId: catMap['buceo'],
      cityId: cityMap['Tulum'],
    },
    {
      id: 'exp-mx-ruinas-tulum-tour',
      title: 'Tour Zona Arqueológica de Tulum',
      description: 'Visita guiada por las ruinas mayas frente al Caribe. Conoce la historia del pueblo maya, los dioses del viento y la astronomía prehispánica con un guía certificado SECTUR.',
      price: 550,
      durationMinutes: 150,
      capacity: 12,
      images: [`${IMG}/photo-1565008576549-57569a49371d?w=800`],
      categoryId: catMap['cultura'],
      cityId: cityMap['Tulum'],
    },
    {
      id: 'exp-mx-snorkel-cancun',
      title: 'Snorkel en el Arrecife de Cancún',
      description: 'Explora el Parque Nacional Arrecife de Puerto Morelos en catamarán. Snorkel entre corales coloridos y peces tropicales a minutos de la Zona Hotelera.',
      price: 850,
      durationMinutes: 180,
      capacity: 15,
      images: [`${IMG}/photo-1510414696678-2415ad8474aa?w=800`],
      categoryId: catMap['playa'],
      cityId: cityMap['Cancún'],
    },
    {
      id: 'exp-mx-cocina-oaxaca',
      title: 'Clase de Cocina Oaxaqueña',
      description: 'Aprende a preparar mole negro, tlayudas y mezcal artesanal con una familia oaxaqueña. Visita al mercado de Tlacolula incluida para seleccionar los ingredientes.',
      price: 1200,
      durationMinutes: 240,
      capacity: 8,
      images: [`${IMG}/photo-1504674900247-0877df9cc836?w=800`],
      categoryId: catMap['gastronomia'],
      cityId: cityMap['Oaxaca'],
    },
    {
      id: 'exp-mx-montealban-oaxaca',
      title: 'Monte Albán — Zona Arqueológica Zapoteca',
      description: 'Tour exclusivo a Monte Albán al amanecer, antes de los grupos masivos. Guía arqueólogo certificado, transporte desde el centro de Oaxaca y tiempo libre en las terrazas.',
      price: 950,
      durationMinutes: 300,
      capacity: 10,
      images: [`${IMG}/photo-1571407970349-bc81e71e70b4?w=800`],
      categoryId: catMap['cultura'],
      cityId: cityMap['Oaxaca'],
    },
    {
      id: 'exp-mx-cdmx-muralismo',
      title: 'Tour Muralismo y Arte Urbano CDMX',
      description: 'Recorre los murales de Diego Rivera en Palacio Nacional y los grafitis contemporáneos de la Colonia Roma en bicicleta. Incluye entrada a museos y café en Coyoacán.',
      price: 750,
      durationMinutes: 210,
      capacity: 12,
      images: [`${IMG}/photo-1565164793769-d06bda5eb128?w=800`],
      categoryId: catMap['cultura'],
      cityId: cityMap['Ciudad de México'],
    },
    {
      id: 'exp-mx-cdmx-gastronomia',
      title: 'Tour Gastronómico Mercado de La Merced',
      description: 'Navega por los sabores de la CDMX en 6 paradas: tacos de canasta, tamales, pulque fresco, antojitos y dulces típicos. Con chef local experto en cocina mexicana tradicional.',
      price: 900,
      durationMinutes: 180,
      capacity: 10,
      images: [`${IMG}/photo-1565565437868-aa62afd2c3d8?w=800`],
      categoryId: catMap['gastronomia'],
      cityId: cityMap['Ciudad de México'],
    },
    {
      id: 'exp-mx-guadalajara-tequila',
      title: 'Ruta del Tequila — Destilería Artesanal',
      description: 'Visita a una destilería familiar en Tequila, Jalisco. Recorrido por los campos de agave azul, proceso de elaboración y cata de 5 tequilas premium. Transfer desde Guadalajara.',
      price: 1500,
      durationMinutes: 480,
      capacity: 14,
      images: [`${IMG}/photo-1568040806546-cfd7af62edb0?w=800`],
      categoryId: catMap['cultura'],
      cityId: cityMap['Guadalajara'],
    },
    {
      id: 'exp-mx-sma-globo',
      title: 'Vuelo en Globo sobre San Miguel de Allende',
      description: 'Surca los cielos al amanecer sobre las cúpulas coloniales y los campos de maguey de San Miguel de Allende. Incluye brindis con cava al aterrizar y certificado de vuelo.',
      price: 2800,
      durationMinutes: 90,
      capacity: 6,
      images: [`${IMG}/photo-1523712999610-f77fbcfc3843?w=800`],
      categoryId: catMap['aventura'],
      cityId: cityMap['San Miguel de Allende'],
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
        countryId: mx.id,
        status: ExperienceStatus.PUBLISHED,
      },
    });
    created++;
    console.log(`  ✓ ${exp.title}`);
  }

  console.log(`\nSeed México completo: ${created} experiencias creadas/actualizadas.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
