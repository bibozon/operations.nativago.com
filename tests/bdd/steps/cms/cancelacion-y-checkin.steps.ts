import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { APIResponse, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { test } from '../../fixtures';
import type { World } from '../../fixtures';

const { Given, When, Then } = createBdd(test);
const prisma = new PrismaClient();
const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

async function sendBooking(page: Page, world: World, guests: number, opts?: { withEmail?: boolean }) {
  const withEmail = opts?.withEmail ?? true;
  return page.request.post('/api/catalog/bookings', {
    data: {
      experienceId: world.experienceId,
      date: world.bookingDate,
      guests,
      customerName: 'Cliente E2E BDD',
      ...(withEmail ? { customerEmail: `cliente_bdd_${Date.now()}@e2e.nativago.com` } : {}),
    },
  });
}

Given('que existe una experiencia publicada sin límite de cupo', async ({ page, world }) => {
  // La ciudad se toma del mismo operador — ver nota en control-cupo.steps.ts
  // sobre por qué tomar listas independientes por índice [0] es frágil.
  const category = await prisma.category.findFirstOrThrow();
  const operator = await prisma.operator.findFirstOrThrow({
    where: { verificationStatus: 'APPROVED' },
    select: { id: true, cityId: true },
  });

  const createRes = await page.request.post('/api/catalog/experience', {
    data: {
      title: `Experiencia sin cupo BDD ${Date.now()}`,
      description: 'Experiencia de prueba para validar el rango de personas.',
      price: 100_000,
      durationMinutes: 120,
      categoryId: category.id,
      cityId: operator.cityId,
      operatorId: operator.id,
    },
  });
  expect(createRes.status()).toBe(201);
  const experience = await createRes.json();

  world.experienceId = experience.id;
  world.bookingDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
});

When('envío una reserva sin email de contacto a la API de reservas', async ({ page, world }) => {
  world.apiResponse = await sendBooking(page, world, 2, { withEmail: false });
});

Then('la API acepta la reserva con {int} personas', async ({ world }, guestsEfectivos: number) => {
  expect(world.apiResponse.status()).toBe(201);
  const body = await world.apiResponse.json();
  expect(body.guests).toBe(guestsEfectivos);
});

Given('que tengo una reserva confirmada para dentro de {int} horas', async ({ world }, hours: number) => {
  const booking = await prisma.booking.create({
    data: {
      bookingCode: `NV-BDD${uid()}`,
      experienceId: world.experienceId as string,
      date: new Date(Date.now() + hours * 60 * 60 * 1000),
      guests: 1,
      customerName: 'Cliente BDD Cancelación',
      customerEmail: `cliente_cancel_${Date.now()}@e2e.nativago.com`,
      amount: 100000,
      depositAmount: 15000,
      remainingAmount: 85000,
      status: 'CONFIRMED',
    },
  });
  world.bookingCode = booking.bookingCode;
  world.bookingEmail = booking.customerEmail;
});

Given('que tengo una reserva ya cancelada', async ({ world }) => {
  const booking = await prisma.booking.create({
    data: {
      bookingCode: `NV-BDD${uid()}`,
      experienceId: world.experienceId as string,
      date: new Date(Date.now() + 72 * 60 * 60 * 1000),
      guests: 1,
      customerName: 'Cliente BDD Cancelación',
      customerEmail: `cliente_cancel_${Date.now()}@e2e.nativago.com`,
      amount: 100000,
      depositAmount: 15000,
      remainingAmount: 85000,
      status: 'CANCELLED',
    },
  });
  world.bookingCode = booking.bookingCode;
  world.bookingEmail = booking.customerEmail;
  world.bookingId = booking.id;
});

When('intento cancelarla con mi email', async ({ page, world }) => {
  world.apiResponse = await page.request.post(`/api/catalog/bookings/${world.bookingCode}/cancel`, {
    data: { email: world.bookingEmail },
  });
});

When('intento cancelarla de nuevo con mi email', async ({ page, world }) => {
  world.apiResponse = await page.request.post(`/api/catalog/bookings/${world.bookingCode}/cancel`, {
    data: { email: world.bookingEmail },
  });
});

When('intento hacer check-in de esa reserva', async ({ page, world }) => {
  world.apiResponse = await page.request.post('/api/checkin', {
    data: { bookingCode: world.bookingCode },
  });
});

Then('el check-in es rechazado con un mensaje de negocio', async ({ world }) => {
  expect(world.apiResponse.status()).toBe(409);
  const body = await world.apiResponse.json();
  expect(body.error).toBeTruthy();
});
