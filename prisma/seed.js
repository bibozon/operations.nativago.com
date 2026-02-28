/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional for dev-only seed)
  await prisma.availabilitySlot.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.operator.deleteMany();
  await prisma.category.deleteMany();
  await prisma.city.deleteMany();

  // --- Ensure default admin user exists ---
  const bcrypt = require('bcryptjs');
  const adminEmail = 'admin@nativago.com';
  const adminPassword = 'nativago123';
  const adminRole = 'SUPERADMIN';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: adminRole,
      name: 'Admin',
    },
  });

  // --- End admin user seed ---

  const categories = await Promise.all(
    [
      { name: 'Buceo', slug: 'buceo' },
      { name: 'Aventura', slug: 'aventura' },
      { name: 'Cultura', slug: 'cultura' },
    ].map((data) => prisma.category.create({ data }))
  );

  const cities = await Promise.all(
    [
      { name: 'Cartagena', country: 'Colombia' },
      { name: 'Santa Marta', country: 'Colombia' },
      { name: 'San Andres', country: 'Colombia' },
    ].map((data) => prisma.city.create({ data }))
  );

  const findCategory = (slug) => categories.find((c) => c.slug === slug);
  const findCity = (name) => cities.find((c) => c.name === name);

  const operators = await Promise.all(
    [
      {
        name: 'Ocean Divers',
        email: 'contact@oceandivers.test',
        phone: '+57 3000000001',
        cityName: 'San Andres',
      },
      {
        name: 'Caribe Tours',
        email: 'contact@caribetours.test',
        phone: '+57 3000000002',
        cityName: 'Cartagena',
      },
    ].map((o) => {
      const city = findCity(o.cityName);
      if (!city) throw new Error(`City not found for operator seed: ${o.cityName}`);
      return prisma.operator.create({
        data: {
          name: o.name,
          email: o.email,
          phone: o.phone,
          cityId: city.id,
        },
      });
    })
  );

  const findOperator = (name) => operators.find((o) => o.name === name);

  const experiences = await Promise.all(
    [
      {
        title: 'Buceo en arrecife',
        description: 'Inmersión guiada en arrecifes de coral con equipo incluido.',
        price: 350000,
        durationMinutes: 180,
        image: '/images/buceo-arrecife.jpg',
        featured: true,
        categorySlug: 'buceo',
        cityName: 'San Andres',
        operatorName: 'Ocean Divers',
      },
      {
        title: 'Tour islas del Rosario',
        description: 'Excursión en lancha a las islas del Rosario desde Cartagena.',
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
        description: 'Senderismo guiado en el Parque Tayrona saliendo desde Santa Marta.',
        price: 220000,
        durationMinutes: 360,
        image: '/images/caminata-tayrona.jpg',
        featured: false,
        categorySlug: 'cultura',
        cityName: 'Santa Marta',
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
    })
  );

  const now = new Date();

  const slotsPromises = experiences.flatMap((experience) => {
    const slotsForExperience = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0); // 09:00 local time

      slotsForExperience.push(
        prisma.availabilitySlot.create({
          data: {
            experienceId: experience.id,
            date,
            startTime,
            capacity: 10,
          },
        })
      );
    }

    return slotsForExperience;
  });

  await Promise.all(slotsPromises);

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
