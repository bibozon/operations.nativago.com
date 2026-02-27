const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@nativago.com";
  const password = process.env.SEED_SUPERADMIN_PASSWORD || "NativaGo!123";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: "ADMIN",
      name: "Super Admin",
    },
    create: {
      email,
      password: passwordHash,
      role: "ADMIN",
      name: "Super Admin",
    },
  });

  // Agencia demo
  const agency = await prisma.agency.upsert({
    where: { id: "demo-agency-1" },
    update: {},
    create: {
      id: "demo-agency-1",
      name: "Agencia Demo NativaGo",
    },
  });

  // Operador demo (como usuario OPERATOR)
  const operatorEmail = "operador.demo@nativago.com";
  const operatorPasswordHash = await bcrypt.hash("Operador!123", 10);

  const operatorUser = await prisma.user.upsert({
    where: { email: operatorEmail },
    update: {},
    create: {
      email: operatorEmail,
      password: operatorPasswordHash,
      role: "OPERATOR",
      name: "Operador Demo",
      agency: { connect: { id: agency.id } },
    },
  });

  const operator = await prisma.operator.upsert({
    where: { userId: operatorUser.id },
    update: {},
    create: {
      userId: operatorUser.id,
      name: "Operador Demo",
      status: "APPROVED",
    },
  });

  // Catálogos básicos
  const city = await prisma.city.upsert({
    where: { name: "Ciudad NativaGo" },
    update: {},
    create: {
      name: "Ciudad NativaGo",
      country: "País Demo",
    },
  });

  const category = await prisma.category.upsert({
    where: { name: "Aventura" },
    update: {},
    create: {
      name: "Aventura",
      description: "Experiencias de aventura demo",
    },
  });

  // Experiencia demo
  const experience = await prisma.experience.upsert({
    where: { id: "demo-experience-1" },
    update: {},
    create: {
      id: "demo-experience-1",
      title: "Tour Demo por la Ciudad",
      description: "Recorrido guiado por la Ciudad NativaGo.",
      durationMinutes: 120,
      price: 50.0,
      coveragePolicy: "COVERAGE_85_15",
      coverageDescription: "Operador 85% / NativaGo 15% (offline).",
      photos: ["https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg"],
      operator: { connect: { id: operator.id } },
      agency: { connect: { id: agency.id } },
      city: { connect: { id: city.id } },
      category: { connect: { id: category.id } },
    },
  });

  // Slots próximos para la experiencia
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const slot1 = await prisma.experienceSlot.create({
    data: {
      date: tomorrow,
      startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0, 0),
      capacity: 10,
      experience: { connect: { id: experience.id } },
    },
  });

  const slot2 = await prisma.experienceSlot.create({
    data: {
      date: dayAfter,
      startTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 16, 0, 0),
      capacity: 8,
      experience: { connect: { id: experience.id } },
    },
  });

  console.log("Super admin ready:", admin.email);
  console.log("Operator user:", operatorUser.email);
  console.log("Experience:", experience.title, "with slots", slot1.id, slot2.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
