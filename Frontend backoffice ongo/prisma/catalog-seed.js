const { PrismaClient: CatalogPrismaClient } = require("../src/services/catalog/infrastructure/db/generated");
const { PrismaClient: PartnerPrismaClient } = require("../src/services/partner/infrastructure/db/generated");

const catalog = new CatalogPrismaClient();
const partnerDb = new PartnerPrismaClient();

async function main() {
  // Categorías demo
  const adventure = await catalog.category.upsert({
    where: { name: "Aventura" },
    update: {},
    create: {
      name: "Aventura",
      description: "Actividades de aventura y outdoor",
    },
  });

  const culture = await catalog.category.upsert({
    where: { name: "Cultural" },
    update: {},
    create: {
      name: "Cultural",
      description: "Tours culturales y city tours",
    },
  });

  // Ciudades demo
  const cusco = await catalog.city.upsert({
    where: { name: "Cusco" },
    update: {},
    create: {
      name: "Cusco",
      country: "Perú",
    },
  });

  const lima = await catalog.city.upsert({
    where: { name: "Lima" },
    update: {},
    create: {
      name: "Lima",
      country: "Perú",
    },
  });

  // Buscar partners creados en partner DB para enlazar experiencias
  const partner1 = await partnerDb.partner.findUnique({ where: { taxId: "PARTNER-001" } });
  const partner2 = await partnerDb.partner.findUnique({ where: { taxId: "PARTNER-002" } });

  if (!partner1 || !partner2) {
    console.warn("Partners demo no encontrados; ejecuta primero prisma:seed:partner");
  }

  // 3 experiencias demo
  if (partner1) {
    await catalog.experience.upsert({
      where: { id: "exp-cusco-full-day" },
      update: {},
      create: {
        id: "exp-cusco-full-day",
        partnerId: partner1.id,
        title: "Full Day Machu Picchu",
        description: "Excursión completa a Machu Picchu con guía certificado.",
        durationMinutes: 600,
        price: 250,
        image: "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg",
        rating: 4.8,
        featured: true,
        cityId: cusco.id,
        categoryId: adventure.id,
      },
    });

    await catalog.experience.upsert({
      where: { id: "exp-cusco-city-tour" },
      update: {},
      create: {
        id: "exp-cusco-city-tour",
        partnerId: partner1.id,
        title: "City Tour Cusco Histórico",
        description: "Recorrido por los principales puntos históricos de Cusco.",
        durationMinutes: 240,
        price: 80,
        image: "https://images.pexels.com/photos/460376/pexels-photo-460376.jpeg",
        rating: 4.6,
        featured: false,
        cityId: cusco.id,
        categoryId: culture.id,
      },
    });
  }

  if (partner2) {
    await catalog.experience.upsert({
      where: { id: "exp-lima-gastronomia" },
      update: {},
      create: {
        id: "exp-lima-gastronomia",
        partnerId: partner2.id,
        title: "Experiencia Gastronómica en Lima",
        description: "Degustación de platos típicos peruanos en Lima.",
        durationMinutes: 180,
        price: 120,
        image: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg",
        rating: 4.9,
        featured: true,
        cityId: lima.id,
        categoryId: culture.id,
      },
    });
  }

  console.log("Catalog seed done", {
    categories: [adventure.name, culture.name],
    cities: [cusco.name, lima.name],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await catalog.$disconnect();
    await partnerDb.$disconnect();
  });
