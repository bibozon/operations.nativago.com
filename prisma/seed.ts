import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@nativago.com';
  const adminPassword = 'Admin123!';
  const adminRole = 'SUPERADMIN';
  const adminName = 'Admin NativaGo';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: adminRole,
      name: adminName,
    },
  });

  console.log('✔️ Admin user ensured (admin@nativago.com / Admin123!)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
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
      { name: 'Barco', slug: 'barco' },
      { name: 'Buceo', slug: 'buceo' },
      { name: 'Snorkel', slug: 'snorkel' },
      { name: 'Surf', slug: 'surf' },
      { name: 'Kayak', slug: 'kayak' },
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
      { name: 'Armação dos Búzios', country: 'Brazil' },
      { name: 'Arraial do Cabo', country: 'Brazil' },
      { name: 'Cabo Frio', country: 'Brazil' },
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
        name: 'Ocean Búzios',
        email: 'buzios@ocean.com',
        phone: '+55 22 99999-1111',
        cityName: 'Armação dos Búzios',
        userEmail: 'freelance@nativago.com',
      },
      {
        name: 'Arraial Boat Tours',
        email: 'arraial@boat.com',
        phone: '+55 22 99999-2222',
        cityName: 'Arraial do Cabo',
        userEmail: 'agency@nativago.com',
      },
      {
        name: 'Cabo Surf School',
        email: 'cabo@surf.com',
        phone: '+55 22 99999-3333',
        cityName: 'Cabo Frio',
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
        title: 'Passeio de Barco Búzios',
        description: 'Tour de barco por las playas de Búzios',
        price: 200,
        durationMinutes: 180,
        image: '/experiences/buzios-boat.jpg',
        featured: true,
        categorySlug: 'barco',
        cityName: 'Armação dos Búzios',
        operatorName: 'Ocean Búzios',
      },
      {
        title: 'Mergulho Arraial',
        description: 'Buceo guiado en Arraial do Cabo',
        price: 350,
        durationMinutes: 120,
        image: '/experiences/arraial-dive.jpg',
        featured: true,
        categorySlug: 'buceo',
        cityName: 'Arraial do Cabo',
        operatorName: 'Arraial Boat Tours',
      },
      {
        title: 'Snorkel Arraial',
        description: 'Snorkel en aguas cristalinas de Arraial do Cabo',
        price: 120,
        durationMinutes: 90,
        image: '/experiences/arraial-snorkel.jpg',
        featured: true,
        categorySlug: 'snorkel',
        cityName: 'Arraial do Cabo',
        operatorName: 'Arraial Boat Tours',
      },
      {
        title: 'Surf Cabo Frio',
        description: 'Clase de surf en Cabo Frio',
        price: 100,
        durationMinutes: 60,
        image: '/experiences/cabo-surf.jpg',
        featured: true,
        categorySlug: 'surf',
        cityName: 'Cabo Frio',
        operatorName: 'Cabo Surf School',
      },
      {
        title: 'Kayak Cabo Frio',
        description: 'Aventura en kayak en Cabo Frio',
        price: 80,
        durationMinutes: 90,
        image: '/experiences/cabo-kayak.jpg',
        featured: true,
        categorySlug: 'kayak',
        cityName: 'Cabo Frio',
        operatorName: 'Cabo Surf School',
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

  // Capacidades mezcladas para slots
  const slotCapacities = [1, 4, 8, 12];
  const slotsPromises = experiences.flatMap((experience, idx) => {
    const slotsForExperience = [] as Promise<unknown>[];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const startTime = new Date(date);
      startTime.setHours(9 + i % 3 * 2, 0, 0, 0); // 09:00, 11:00, 13:00
      const capacity = slotCapacities[(idx + i) % slotCapacities.length];
      slotsForExperience.push(
        prisma.availabilitySlot.create({
          data: {
            experienceId: experience.id,
            date,
            startTime,
            capacity,
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
