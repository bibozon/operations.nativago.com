import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Desarrollo: limpiamos datos previos para tener un estado consistente
  await prisma.availabilitySlot.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.city.deleteMany();

  const superadminPasswordHash = '$2a$10$KXx4Xx1NiB0O0b.fw2Q7VeuP4I9Y8tS5W0w7tH8k8nQvXoWz1YpK';
  const agencyPasswordHash = '$2a$10$KXx4Xx1NiB0O0b.fw2Q7VeuP4I9Y8tS5W0w7tH8k8nQvXoWz1YpK';
  const freelancePasswordHash = '$2a$10$KXx4Xx1NiB0O0b.fw2Q7VeuP4I9Y8tS5W0w7tH8k8nQvXoWz1YpK';

  const categories = await Promise.all(
    [
      { name: 'Buceo', slug: 'buceo' },
      { name: 'Aventura', slug: 'aventura' },
      { name: 'Cultura', slug: 'cultura' },
      { name: 'Paseos en barco', slug: 'paseos-barco' },
      { name: 'Playas', slug: 'playa' },
    ].map((data) =>
      prisma.category.upsert({
        where: { slug: data.slug },
        update: {},
        create: data,
      }),
    ),
  );

  const cities = await Promise.all(
    [
      { name: 'Cartagena', country: 'Colombia' },
      { name: 'Santa Marta', country: 'Colombia' },
      { name: 'San Andres', country: 'Colombia' },
      { name: 'Cabo Frio', country: 'Brazil' },
      { name: 'Arraial do Cabo', country: 'Brazil' },
      { name: 'Armação dos Búzios', country: 'Brazil' },
    ].map((data) => prisma.city.create({ data })),
  );

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@nativago.com',
        password: superadminPasswordHash,
        name: 'Super Admin',
        role: 'SUPERADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'agency@nativago.com',
        password: agencyPasswordHash,
        name: 'Agency Operator',
        role: 'OPERATOR_AGENCY',
      },
    }),
    prisma.user.create({
      data: {
        email: 'freelance@nativago.com',
        password: freelancePasswordHash,
        name: 'Freelance Operator',
        role: 'OPERATOR_FREELANCE',
      },
    }),
  ]);

  const findUser = (email: string) => users.find((u) => u.email === email);

  const findCategory = (slug: string) => categories.find((c) => c.slug === slug);
  const findCity = (name: string) => cities.find((c) => c.name === name);

  const operators = await Promise.all(
    [
      {
        name: 'Ocean Divers',
        email: 'contact@oceandivers.test',
        phone: '+57 3000000001',
        cityName: 'San Andres',
        userEmail: 'freelance@nativago.com',
      },
      {
        name: 'Caribe Tours',
        email: 'contact@caribetours.test',
        phone: '+57 3000000002',
        cityName: 'Cartagena',
        userEmail: 'agency@nativago.com',
      },
    ].map((o) => {
      const city = findCity(o.cityName);
      const user = findUser(o.userEmail);
      if (!city) throw new Error(`City not found for operator seed: ${o.cityName}`);
      if (!user) throw new Error(`User not found for operator seed: ${o.userEmail}`);

      return prisma.operator.create({
        data: {
          name: o.name,
          email: o.email,
          phone: o.phone,
          cityId: city.id,
          userId: user.id,
        },
      });
    }),
  );

  const findOperator = (name: string) => operators.find((o) => o.name === name);

  const experiences = await Promise.all(
    [
      {
        title: 'Buceo en arrecife',
        description:
          'Inmersión guiada en arrecifes de coral con equipo incluido en aguas de Cartagena.',
        price: 350000,
        durationMinutes: 180,
        image: '/images/buceo-arrecife.jpg',
        featured: true,
        categorySlug: 'buceo',
        cityName: 'Cartagena',
        operatorName: 'Caribe Tours',
      },
      {
        title: 'Tour islas del Rosario',
        description:
          'Excursión en lancha a las islas del Rosario desde Cartagena con almuerzo y tiempo libre para snorkel.',
        price: 280000,
        durationMinutes: 420,
        image: '/images/islas-rosario.jpg',
        featured: true,
        categorySlug: 'aventura',
        cityName: 'Cartagena',
        operatorName: 'Caribe Tours',
      },
      {
        title: 'Caminata Tayrona',
        description:
          'Senderismo guiado en el Parque Tayrona saliendo desde Santa Marta, con paradas en miradores y playas.',
        price: 220000,
        durationMinutes: 360,
        image: '/images/caminata-tayrona.jpg',
        featured: true,
        categorySlug: 'aventura',
        cityName: 'Santa Marta',
        operatorName: 'Caribe Tours',
      },
      {
        title: 'Snorkel San Andres',
        description:
          'Salida de snorkel en San Andres para explorar el mar de siete colores con guía certificado.',
        price: 180000,
        durationMinutes: 150,
        image: '/images/snorkel-san-andres.jpg',
        featured: true,
        categorySlug: 'buceo',
        cityName: 'San Andres',
        operatorName: 'Ocean Divers',
      },
      {
        title: 'Ruta cultural Cartagena',
        description:
          'Recorrido cultural a pie por el centro histórico de Cartagena, con guía local y degustaciones.',
        price: 150000,
        durationMinutes: 180,
        image: '/images/ruta-cultural-cartagena.jpg',
        featured: true,
        categorySlug: 'cultura',
        cityName: 'Cartagena',
        operatorName: 'Caribe Tours',
      },
    ].map((e) => {
      const category = findCategory(e.categorySlug);
      const city = findCity(e.cityName);
      const operator = findOperator(e.operatorName);

      if (!category) throw new Error(`Category not found for experience seed: ${e.categorySlug}`);
      if (!city) throw new Error(`City not found for experience seed: ${e.cityName}`);
      if (!operator) throw new Error(`Operator not found for experience seed: ${e.operatorName}`);

      return prisma.experience.create({
        data: {
          title: e.title,
          description: e.description,
          price: e.price,
          durationMinutes: e.durationMinutes,
          image: e.image,
          featured: e.featured,
          categoryId: category.id,
          cityId: city.id,
          operatorId: operator.id,
        },
      });
    }),
  );

  // Brazil pilot: Cabo Frio, Arraial do Cabo, Armação dos Búzios
  const caboFrio = findCity('Cabo Frio');
  const arraial = findCity('Arraial do Cabo');
  const buzios = findCity('Armação dos Búzios');

  if (!caboFrio) throw new Error('City not found for Brazil seed: Cabo Frio');
  if (!arraial) throw new Error('City not found for Brazil seed: Arraial do Cabo');
  if (!buzios) throw new Error('City not found for Brazil seed: Armação dos Búzios');

  const boat = findCategory('paseos-barco');
  const dive = findCategory('buceo');
  const beach = findCategory('playa');

  if (!boat) throw new Error('Category not found for Brazil seed: paseos-barco');
  if (!dive) throw new Error('Category not found for Brazil seed: buceo');
  if (!beach) throw new Error('Category not found for Brazil seed: playa');

  const caboOperator = await prisma.operator.upsert({
    where: { email: 'cabo@operador.com' },
    update: {},
    create: {
      name: 'Cabo Boat Tours',
      email: 'cabo@operador.com',
      phone: '+55 22 99999-1111',
      cityId: caboFrio.id,
      type: 'AGENCY',
      verificationStatus: 'APPROVED',
    },
  });

  const arraialOperator = await prisma.operator.upsert({
    where: { email: 'arraial@operador.com' },
    update: {},
    create: {
      name: 'Arraial Adventures',
      email: 'arraial@operador.com',
      phone: '+55 22 99999-2222',
      cityId: arraial.id,
      type: 'AGENCY',
      verificationStatus: 'APPROVED',
    },
  });

  const buziosOperator = await prisma.operator.upsert({
    where: { email: 'buzios@operador.com' },
    update: {},
    create: {
      name: 'Búzios Experience',
      email: 'buzios@operador.com',
      phone: '+55 22 99999-3333',
      cityId: buzios.id,
      type: 'AGENCY',
      verificationStatus: 'APPROVED',
    },
  });

  await prisma.experience.createMany({
    data: [
      {
        title: 'Passeio de barco pelas ilhas de Cabo Frio',
        description: 'Tour completo pelas praias e ilhas cristalinas de Cabo Frio',
        price: 180,
        durationMinutes: 240,
        cityId: caboFrio.id,
        categoryId: boat.id,
        operatorId: caboOperator.id,
        featured: true,
        image: '/experiences/cabo-boat.jpg',
      },
      {
        title: 'Mergulho guiado em Cabo Frio',
        description: 'Experiência de mergulho para iniciantes',
        price: 250,
        durationMinutes: 180,
        cityId: caboFrio.id,
        categoryId: dive.id,
        operatorId: caboOperator.id,
        image: '/experiences/cabo-dive.jpg',
      },
    ],
  });

  await prisma.experience.createMany({
    data: [
      {
        title: 'Passeio de barco em Arraial do Cabo',
        description: 'Conheça o Caribe brasileiro',
        price: 220,
        durationMinutes: 240,
        cityId: arraial.id,
        categoryId: boat.id,
        operatorId: arraialOperator.id,
        featured: true,
        image: '/experiences/arraial-boat.jpg',
      },
      {
        title: 'Snorkel na Prainha',
        description: 'Snorkel em águas cristalinas',
        price: 120,
        durationMinutes: 120,
        cityId: arraial.id,
        categoryId: beach.id,
        operatorId: arraialOperator.id,
        image: '/experiences/arraial-snorkel.jpg',
      },
    ],
  });

  await prisma.experience.createMany({
    data: [
      {
        title: 'Escuna por Búzios',
        description: 'Passeio clássico pelas praias de Búzios',
        price: 200,
        durationMinutes: 240,
        cityId: buzios.id,
        categoryId: boat.id,
        operatorId: buziosOperator.id,
        featured: true,
        image: '/experiences/buzios-boat.jpg',
      },
      {
        title: 'Tour de praias em buggy',
        description: 'Passeio terrestre pelas praias',
        price: 300,
        durationMinutes: 180,
        cityId: buzios.id,
        categoryId: beach.id,
        operatorId: buziosOperator.id,
        image: '/experiences/buzios-buggy.jpg',
      },
    ],
  });

  const now = new Date();

  const slotsPromises = experiences.flatMap((experience) => {
    const slotsForExperience = [] as Promise<unknown>[];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0); // 09:00 hora local

      slotsForExperience.push(
        prisma.availabilitySlot.create({
          data: {
            experienceId: experience.id,
            date,
            startTime,
            capacity: 10,
          },
        }),
      );
    }

    return slotsForExperience;
  });

  await Promise.all(slotsPromises);

  console.log('Seed completed successfully (TS)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
