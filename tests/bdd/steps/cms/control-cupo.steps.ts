import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { APIResponse, Page } from '@playwright/test';
import { test } from '../../fixtures';
import type { World } from '../../fixtures';

const { Given, When, Then } = createBdd(test);

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
  const [catRes, cityRes, opRes] = await Promise.all([
    page.request.get('/api/catalog/categories'),
    page.request.get('/api/catalog/cities'),
    page.request.get('/api/catalog/operator'),
  ]);
  const { categories } = await catRes.json();
  const cities     = await cityRes.json();
  const operators  = await opRes.json();

  const category = categories[0];
  const city     = cities[0];
  const operator = operators[0];
  expect(category, 'debe existir al menos una categoría').toBeTruthy();
  expect(city, 'debe existir al menos una ciudad').toBeTruthy();
  expect(operator, 'debe existir al menos un operador').toBeTruthy();

  const createRes = await page.request.post('/api/catalog/experience', {
    data: {
      title:           `Experiencia cupo BDD ${Date.now()}`,
      description:     'Experiencia de prueba para validar el control de cupo.',
      price:           100_000,
      durationMinutes: 120,
      categoryId:      category.id,
      cityId:          city.id,
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
