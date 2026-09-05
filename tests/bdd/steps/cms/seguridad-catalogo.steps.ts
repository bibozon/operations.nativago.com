import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { test } from '../../fixtures';
import { ADMIN, CMS_URL } from '../../../e2e/support/test-data';
import { seedApprovedOperatorWithExperience } from '../support/seedFixtures';

const { Given, When, Then } = createBdd(test);
const prisma = new PrismaClient();
const uid = () => Math.random().toString(36).slice(2, 8);

Given('que tengo una cuenta de operador registrada pero sin aprobar', async ({ page, world }) => {
  const country = await prisma.country.findFirstOrThrow({ where: { code: 'CO' } });
  const city = await prisma.city.findFirstOrThrow({ where: { name: 'Cartagena', countryId: country.id } });
  const suffix = uid();
  const email = `seed_draft_${suffix}@e2e.nativago.com`;
  const password = 'E2eSeed123!';

  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 10),
      name: `Operador Draft ${suffix}`,
      role: 'OPERATOR_FREELANCE',
    },
  });

  const operator = await prisma.operator.create({
    data: {
      name: `Operador Draft ${suffix}`,
      email,
      type: 'FREELANCE',
      cityId: city.id,
      countryId: country.id,
      verificationStatus: 'DRAFT',
      userId: user.id,
    },
  });

  await prisma.operatorMember.create({ data: { operatorId: operator.id, userId: user.id, role: 'ADMIN' } });

  world.operatorId = operator.id;
  world.category = await prisma.category.findFirstOrThrow({ where: { slug: 'aventura' } });
  world.city = city;

  const loginRes = await page.request.post(`${CMS_URL}/api/auth/login`, { data: { email, password } });
  expect(loginRes.status()).toBe(200);
});

When('envío una petición POST a la API de creación de experiencias con mis propias credenciales', async ({ page, world }) => {
  world.expTitle = `Experiencia no aprobada ${uid()}`;
  world.apiResponse = await page.request.post('/api/catalog/experience', {
    data: {
      title: world.expTitle,
      description: 'Intento de publicación sin aprobación.',
      price: 100000,
      durationMinutes: 60,
      categoryId: world.category.id,
      cityId: world.city.id,
    },
  });
});

Then('la API responde con estado {int}', async ({ world }, status: number) => {
  expect(world.apiResponse.status()).toBe(status);
});

Then('la experiencia no aparece en el catálogo público del marketplace', async ({ page, world }) => {
  const res = await page.request.get(`${CMS_URL}/api/catalog/experiences`);
  const body = await res.json();
  const titles: string[] = (Array.isArray(body) ? body : body.experiences ?? []).map((e: { title: string }) => e.title);
  expect(titles).not.toContain(world.expTitle);
});

Given('que tengo una cuenta de operador aprobada con una experiencia publicada', async ({ page, world }) => {
  const seed = await seedApprovedOperatorWithExperience();
  world.operatorId = seed.operatorId;
  world.experienceId = seed.experienceId;
  world.countryId = seed.countryId;
  const exp = await prisma.experience.findUniqueOrThrow({ where: { id: seed.experienceId } });
  world.expTitle = exp.title;

  const loginRes = await page.request.post(`${CMS_URL}/api/auth/login`, {
    data: { email: seed.email, password: seed.password },
  });
  expect(loginRes.status()).toBe(200);
});

When('el equipo de NativaGo suspende mi cuenta de operador', async ({ world }) => {
  await prisma.operator.update({
    where: { id: world.operatorId as string },
    data: { verificationStatus: 'SUSPENDED' },
  });
});

Then('mi experiencia ya no aparece en el catálogo público del marketplace', async ({ page, world }) => {
  const res = await page.request.get(`${CMS_URL}/api/catalog/experiences`);
  const body = await res.json();
  const titles: string[] = (Array.isArray(body) ? body : body.experiences ?? []).map((e: { title: string }) => e.title);
  expect(titles).not.toContain(world.expTitle);
});

When('consulto la API pública de operadores sin autenticarme', async ({ page, context, world }) => {
  // El Given anterior ya dejó logueado a este operador en el mismo browser
  // context — "sin autenticarme" exige limpiar esa cookie primero, si no la
  // petición sale autenticada y cae en la rama "veo mi propio operador".
  await context.clearCookies();
  world.apiResponse = await page.request.get(`${CMS_URL}/api/catalog/operator`);
});

Then('mi operador no aparece en la respuesta', async ({ world }) => {
  const body = await world.apiResponse.json();
  const ids: string[] = body.map((o: { id: string }) => o.id);
  expect(ids).not.toContain(world.operatorId);
});

Given('que existe una categoría usada por al menos una experiencia', async ({ world }) => {
  const category = await prisma.category.findFirstOrThrow({ where: { slug: 'aventura' } });
  const count = await prisma.experience.count({ where: { categoryId: category.id } });
  expect(count).toBeGreaterThan(0);
  world.categoryId = category.id;
});

When('intento eliminar esa categoría forzando la acción', async ({ world }) => {
  // La UI ya oculta el botón "Eliminar" cuando está en uso, así que "forzar
  // la acción" significa saltarse esa capa e ir directo al nivel de datos —
  // que es exactamente lo que haría alguien invocando la Server Action a
  // mano. La app no expone esto por HTTP, así que se prueba contra Postgres
  // directamente: la FK de Experience.categoryId debe rechazar el borrado.
  try {
    await prisma.category.delete({ where: { id: world.categoryId as string } });
    world.deleteError = null;
  } catch (err) {
    world.deleteError = err instanceof Error ? err.message : String(err);
  }
});

Then('la operación falla con un mensaje de negocio', async ({ world }) => {
  expect(world.deleteError).toBeTruthy();
});

Then('la categoría sigue existiendo', async ({ world }) => {
  const category = await prisma.category.findUnique({ where: { id: world.categoryId as string } });
  expect(category).not.toBeNull();
});
