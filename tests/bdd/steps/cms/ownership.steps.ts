import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { test } from '../../fixtures';
import { CMS_URL } from '../../../e2e/support/test-data';
import {
  seedApprovedOperatorWithExperience,
  seedActiveBooking,
  findCityInOtherCountry,
} from '../support/seedFixtures';

const { Given, When, Then } = createBdd(test);
const prisma = new PrismaClient();

Given('existe otra experiencia que pertenece a un operador distinto', async ({ world }) => {
  const other = await seedApprovedOperatorWithExperience();
  world.otherExperienceId = other.experienceId;
  const exp = await prisma.experience.findUniqueOrThrow({ where: { id: other.experienceId } });
  world.otherExpTitle = exp.title;
  world.otherExpPrice = exp.price;
});

Given('existe otra experiencia que pertenece a un operador distinto con una reserva', async ({ world }) => {
  const other = await seedApprovedOperatorWithExperience();
  world.otherExperienceId = other.experienceId;
  const exp = await prisma.experience.findUniqueOrThrow({ where: { id: other.experienceId } });
  world.otherExpTitle = exp.title;
  await seedActiveBooking(other.experienceId);
});

When('intento editar esa experiencia ajena por la API', async ({ page, world }) => {
  world.apiResponse = await page.request.put('/api/catalog/experience', {
    data: { id: world.otherExperienceId, title: 'Título modificado por otro operador' },
  });
});

Then('la experiencia ajena no cambia', async ({ world }) => {
  const exp = await prisma.experience.findUniqueOrThrow({ where: { id: world.otherExperienceId as string } });
  expect(exp.title).toBe(world.otherExpTitle);
});

When('intento eliminar esa experiencia ajena por su formulario', async ({ page, world }) => {
  await page.goto('/admin/experiences');
  await page.waitForLoadState('networkidle');
  const row = page.locator('tr', { hasText: world.otherExpTitle as string });
  world.rowExistedBefore = (await row.count()) > 0;
  if (world.rowExistedBefore) {
    await row.getByRole('button', { name: /Eliminar|Delete/ }).click();
    await page.waitForLoadState('networkidle');
  }
});

Then('la experiencia ajena sigue existiendo', async ({ world }) => {
  const exp = await prisma.experience.findUnique({ where: { id: world.otherExperienceId as string } });
  expect(exp).not.toBeNull();
});

When('voy a la administración de reservas', async ({ page }) => {
  await page.goto('/admin/bookings');
  await page.waitForLoadState('networkidle');
});

Then('solo veo reservas de mis propias experiencias', async ({ page, world }) => {
  await expect(page.getByText(world.otherExpTitle as string)).toHaveCount(0);
});

When('intento crear una experiencia con una ciudad de otro país', async ({ page, world }) => {
  const otherCity = await findCityInOtherCountry(world.countryId as string);
  const category = await prisma.category.findFirstOrThrow({ where: { slug: 'aventura' } });
  world.apiResponse = await page.request.post('/api/catalog/experience', {
    data: {
      title: 'Experiencia con ciudad de otro país',
      description: 'No debería poder crearse.',
      price: 100000,
      durationMinutes: 60,
      categoryId: category.id,
      cityId: otherCity.id,
    },
  });
});

Then('no se publica ninguna experiencia nueva', async ({ world }) => {
  const exp = await prisma.experience.findFirst({ where: { title: 'Experiencia con ciudad de otro país' } });
  expect(exp).toBeNull();
});

Given('esa experiencia tiene una reserva activa', async ({ world }) => {
  await seedActiveBooking(world.experienceId as string);
});

When('intento eliminar mi propia experiencia por su formulario', async ({ page, world }) => {
  await page.goto('/admin/experiences');
  await page.waitForLoadState('networkidle');
  const row = page.locator('tr', { hasText: world.expTitle as string });
  await row.getByRole('button', { name: /Eliminar|Delete/ }).click();
  await page.waitForLoadState('networkidle');
});

Then('veo un mensaje de negocio explicando por qué no se puede eliminar', async ({ page }) => {
  await expect(page.getByText(/tiene reservas activas|active bookings/i)).toBeVisible({ timeout: 6_000 });
});

Then('mi experiencia sigue visible en mi panel', async ({ page, world }) => {
  await expect(page.getByText(world.expTitle as string)).toBeVisible();
});
