/**
 * globalSetup — se ejecuta UNA VEZ antes de todos los tests.
 *
 * Garantiza que la DB tiene:
 *  - Usuario SUPERADMIN de prueba
 *  - Países CO y BR con sus ciudades
 *  - Al menos una Categoría ("Aventura")
 *  - Un operador semilla aprobado (FREELANCE, CO) con una experiencia publicada
 *    → el catálogo del Marketplace siempre tendrá algo que mostrar.
 *
 * Es idempotente: puede correrse n veces sin duplicar datos.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt           from 'bcryptjs';

export default async function globalSetup() {
  const prisma = new PrismaClient();

  try {

    // ── 1. SUPERADMIN de prueba ──────────────────────────────────────────
    const ADMIN_EMAIL    = 'admin@nativago.com';
    const ADMIN_PASSWORD = 'nativago123';
    await prisma.user.upsert({
      where:  { email: ADMIN_EMAIL },
      update: { password: await bcrypt.hash(ADMIN_PASSWORD, 10) },
      create: {
        email:    ADMIN_EMAIL,
        password: await bcrypt.hash(ADMIN_PASSWORD, 10),
        role:     'SUPERADMIN',
        name:     'Admin E2E',
      },
    });
    console.log('globalSetup ✓  admin SUPERADMIN listo');

    // ── 2. Países ────────────────────────────────────────────────────────
    const coCountry = await prisma.country.findFirst({ where: { code: 'CO' } });
    const brCountry = await prisma.country.findFirst({ where: { code: 'BR' } });

    if (!coCountry) console.warn('globalSetup ⚠   País CO no encontrado — corre seed-countries.js');
    if (!brCountry) console.warn('globalSetup ⚠   País BR no encontrado — corre seed-countries.js');

    // ── 3. Ciudades Colombia ─────────────────────────────────────────────
    if (coCountry) {
      const coCities = ['Cartagena', 'Medellín', 'Santa Marta', 'Bogotá'];
      for (const cityName of coCities) {
        const exists = await prisma.city.findFirst({
          where: { name: cityName, countryId: coCountry.id },
        });
        if (!exists) {
          await prisma.city.create({
            data: { name: cityName, country: 'Colombia', countryId: coCountry.id },
          });
          console.log(`globalSetup ✓  ciudad CO creada: ${cityName}`);
        }
      }
      // Parchear ciudades CO que ya existen pero no tienen countryId
      const updated = await prisma.city.updateMany({
        where: { country: 'Colombia', countryId: null },
        data:  { countryId: coCountry.id },
      });
      if (updated.count > 0) {
        console.log(`globalSetup ✓  ${updated.count} ciudades CO actualizadas con countryId`);
      }
    }

    // ── 4. Ciudades Brasil ───────────────────────────────────────────────
    if (brCountry) {
      const brCities = ['Manaus', 'Rio de Janeiro', 'Florianópolis', 'São Paulo'];
      for (const cityName of brCities) {
        const exists = await prisma.city.findFirst({
          where: { name: cityName, countryId: brCountry.id },
        });
        if (!exists) {
          await prisma.city.create({
            data: { name: cityName, country: 'Brasil', countryId: brCountry.id },
          });
          console.log(`globalSetup ✓  ciudad BR creada: ${cityName}`);
        }
      }
    }

    // ── 5. Categoría mínima ──────────────────────────────────────────────
    const category = await prisma.category.upsert({
      where:  { slug: 'aventura' },
      update: {},
      create: { name: 'Aventura', slug: 'aventura' },
    });
    console.log(`globalSetup ✓  categoría "${category.name}" lista (id: ${category.id})`);

    // ── 6. Operador semilla (CO, aprobado) ───────────────────────────────
    if (coCountry) {
      const seedEmail = 'seed-operador@e2e.nativago.com';
      const cartagena = await prisma.city.findFirst({
        where: { name: 'Cartagena', countryId: coCountry.id },
      });

      if (!cartagena) {
        console.warn('globalSetup ⚠   Cartagena no encontrada — experiencia semilla no creada');
      } else {
        let seedUser = await prisma.user.findUnique({ where: { email: seedEmail } });
        if (!seedUser) {
          seedUser = await prisma.user.create({
            data: {
              email:                   seedEmail,
              name:                    'Seed Operador E2E',
              password:                await bcrypt.hash('SeedPwd123!', 10),
              role:                    'OPERATOR_FREELANCE',
              operatorTermsAccepted:   true,
              operatorTermsAcceptedAt: new Date(),
            },
          });
        }

        let seedOperator = await prisma.operator.findFirst({ where: { userId: seedUser.id } });
        if (!seedOperator) {
          seedOperator = await prisma.operator.create({
            data: {
              name:                'Seed Operador E2E',
              email:               seedEmail,
              type:                'FREELANCE',
              cityId:              cartagena.id,
              countryId:           coCountry.id,
              verificationStatus:  'APPROVED',
              contractAccepted:    true,
              contractAcceptedAt:  new Date(),
              liabilityAccepted:   true,
              liabilityAcceptedAt: new Date(),
              licenseNumber:       'SEED-E2E-001',
              userId:              seedUser.id,
            },
          });
          console.log('globalSetup ✓  operador semilla CO creado');
        }

        // ── 7. Experiencia semilla ───────────────────────────────────
        const SEED_TITLE = 'Tour de prueba E2E NativaGo';
        const existingExp = await prisma.experience.findFirst({
          where: { title: SEED_TITLE, operatorId: seedOperator.id },
        });
        if (!existingExp) {
          await prisma.experience.create({
            data: {
              title:           SEED_TITLE,
              description:     'Experiencia de prueba creada automáticamente para los tests E2E. No reservar.',
              durationMinutes: 120,
              price:           280000,
              cityId:          cartagena.id,
              countryId:       coCountry.id,
              categoryId:      category.id,
              operatorId:      seedOperator.id,
              images:          [],
            },
          });
          console.log(`globalSetup ✓  experiencia semilla creada: "${SEED_TITLE}" — COP 280.000`);
        } else {
          console.log(`globalSetup ✓  experiencia semilla ya existe: "${SEED_TITLE}"`);
        }
      }
    }

  } catch (err) {
    console.error('globalSetup ✗  error:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}
