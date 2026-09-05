import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const uid = () => Math.random().toString(36).slice(2, 8);

export const SEED_PASSWORD = 'E2eSeed123!';

/**
 * Crea un operador FREELANCE ya aprobado (contrato aceptado) con una
 * experiencia publicada, directo por Prisma — evita repetir el wizard de
 * registro completo (registro → aprobación → contrato) cuando el escenario
 * no está probando ese flujo, solo necesita "un operador aprobado que existe".
 */
export async function seedApprovedOperatorWithExperience(opts?: { cityName?: string }) {
  const country = await prisma.country.findFirstOrThrow({ where: { code: 'CO' } });
  const city = await prisma.city.findFirstOrThrow({
    where: { name: opts?.cityName ?? 'Cartagena', countryId: country.id },
  });
  const category = await prisma.category.findFirstOrThrow({ where: { slug: 'aventura' } });

  const suffix = uid();
  const email = `seed_own_${suffix}@e2e.nativago.com`;

  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(SEED_PASSWORD, 10),
      name: `Operador Seed ${suffix}`,
      role: 'OPERATOR_FREELANCE',
      operatorTermsAccepted: true,
      operatorTermsAcceptedAt: new Date(),
    },
  });

  const operator = await prisma.operator.create({
    data: {
      name: `Operador Seed ${suffix}`,
      email,
      type: 'FREELANCE',
      cityId: city.id,
      countryId: country.id,
      verificationStatus: 'APPROVED',
      contractAccepted: true,
      contractAcceptedAt: new Date(),
      liabilityAccepted: true,
      liabilityAcceptedAt: new Date(),
      licenseNumber: `SEED-${suffix}`,
      userId: user.id,
    },
  });

  await prisma.operatorMember.create({
    data: { operatorId: operator.id, userId: user.id, role: 'ADMIN' },
  });

  const experience = await prisma.experience.create({
    data: {
      title: `Experiencia seed ${suffix}`,
      description: 'Experiencia creada para un escenario BDD de ownership. No reservar.',
      durationMinutes: 90,
      price: 150000,
      cityId: city.id,
      countryId: country.id,
      categoryId: category.id,
      operatorId: operator.id,
      images: [],
    },
  });

  return { email, password: SEED_PASSWORD, operatorId: operator.id, experienceId: experience.id, cityId: city.id, countryId: country.id };
}

/** Una reserva activa (no cancelada) para una experiencia, para probar que borrarla se bloquea. */
export async function seedActiveBooking(experienceId: string) {
  const suffix = uid();
  const booking = await prisma.booking.create({
    data: {
      experienceId,
      date: new Date(Date.now() + 48 * 60 * 60 * 1000),
      guests: 2,
      customerName: 'Cliente Seed BDD',
      customerEmail: `cliente_seed_${suffix}@e2e.nativago.com`,
      amount: 150000,
      depositAmount: 22500,
      remainingAmount: 127500,
      status: 'CONFIRMED',
    },
  });
  return booking;
}

/** Ciudad de un país distinto al del operador — para probar el aislamiento multi-país. */
export async function findCityInOtherCountry(countryId: string) {
  return prisma.city.findFirstOrThrow({ where: { countryId: { not: countryId } } });
}

export async function countCategoryExperiences(categoryId: string) {
  return prisma.experience.count({ where: { categoryId } });
}

export async function disconnectSeedFixtures() {
  await prisma.$disconnect();
}
