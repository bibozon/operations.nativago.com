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
