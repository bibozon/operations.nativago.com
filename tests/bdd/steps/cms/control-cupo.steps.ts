import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { APIResponse, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { test } from '../../fixtures';
import type { World } from '../../fixtures';

const { Given, When, Then } = createBdd(test);
const prisma = new PrismaClient();

async function sendBooking(page: Page, world: World, guests: number): Promise<APIResponse> {
  return page.request.post('/api/catalog/bookings', {
    data: {
      experienceId:  world.experienceId,
      date:          world.bookingDate,
      guests,
      customerName:  'Cliente E2E BDD',
      customerEmail: `cliente_bdd_${Date.now()}@e2e.nativago.com`,
    },
  });
}

Given('existe una experiencia publicada con cupo máximo de {int} personas', async ({ page, world }, capacity: number) => {
  // La ciudad se toma DEL MISMO operador (no de una lista independiente) —
  // tomar category[0]/city[0]/operator[0] de 3 fetches sin relación entre sí
  // rompía en cuanto el orden de alguna lista cambiaba y dejaba de coincidir
  // con el país del operador (assertCityBelongsToCountry lo rechaza con 400).
  const category = await prisma.category.findFirstOrThrow();
  const operator = await prisma.operator.findFirstOrThrow({
    where: { verificationStatus: 'APPROVED' },
    select: { id: true, cityId: true },
  });
  expect(category, 'debe existir al menos una categoría').toBeTruthy();
  expect(operator, 'debe existir al menos un operador aprobado').toBeTruthy();

  const createRes = await page.request.post('/api/catalog/experience', {
    data: {
      title:           `Experiencia cupo BDD ${Date.now()}`,
      description:     'Experiencia de prueba para validar el control de cupo.',
      price:           100_000,
      durationMinutes: 120,
      categoryId:      category.id,
      cityId:          operator.cityId,
      operatorId:      operator.id,
    },
  });
  expect(createRes.status()).toBe(201);
  const experience = await createRes.json();

  // El formulario de creación no expone "cupo" — se fija vía PUT, que sí
  // persiste el campo capacity de Experience (ver src/services/catalog/cms.ts).
  const updateRes = await page.request.put('/api/catalog/experience', {
    data: { id: experience.id, capacity },
  });
  expect(updateRes.status()).toBe(200);

  world.experienceId = experience.id;
  world.bookingDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
});

When('envío una reserva para {int} persona(s) a la API de reservas', async ({ page, world }, guests: number) => {
  world.apiResponse = await sendBooking(page, world, guests);
});

Given('que ya reservé {int} persona(s) para esa experiencia y fecha', async ({ page, world }, guests: number) => {
  const res = await sendBooking(page, world, guests);
  expect(res.status()).toBe(201);
});

Then('la API responde con estado {int} y un código de reserva', async ({ world }, status: number) => {
  expect(world.apiResponse.status()).toBe(status);
  const body = await world.apiResponse.json();
  expect(body.bookingCode).toBeTruthy();
});

// "la API responde con estado {int} y el mensaje {string}" (caso 409) ya está
// definido en autenticacion.steps.ts y se reutiliza tal cual — ambos leen
// world.apiResponse.
