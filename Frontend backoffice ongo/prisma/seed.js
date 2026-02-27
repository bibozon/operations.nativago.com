const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@nativago.com";
  const password = process.env.SEED_SUPERADMIN_PASSWORD || "NativaGo!123";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
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

  console.log("Super admin ready:", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
