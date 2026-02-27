const { PrismaClient } = require("../src/services/partner/infrastructure/db/generated");

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

async function main() {
  // Partners demo
  const partner1 = await prisma.partner.upsert({
    where: { taxId: "PARTNER-001" },
    update: {},
    create: {
      name: "Partner Andes Travel",
      legalName: "Andes Travel S.A.C.",
      taxId: "PARTNER-001",
    },
  });

  const partner2 = await prisma.partner.upsert({
    where: { taxId: "PARTNER-002" },
    update: {},
    create: {
      name: "Partner Lima Tours",
      legalName: "Lima Tours S.A.",
      taxId: "PARTNER-002",
    },
  });

  // Operadores demo
  await prisma.operator.upsert({
    where: { email: "operador.cusco@nativago.com" },
    update: {},
    create: {
      partnerId: partner1.id,
      name: "Operador Cusco",
      email: "operador.cusco@nativago.com",
      phone: "+51 999 111 222",
      status: "ACTIVE",
    },
  });

  await prisma.operator.upsert({
    where: { email: "operador.lima@nativago.com" },
    update: {},
    create: {
      partnerId: partner2.id,
      name: "Operador Lima",
      email: "operador.lima@nativago.com",
      phone: "+51 988 333 444",
      status: "ACTIVE",
    },
  });

  console.log("Partner seed done", { partners: [partner1.name, partner2.name] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
