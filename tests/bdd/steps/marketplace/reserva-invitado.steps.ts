import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { test } from '../../fixtures';
import { CatalogPage } from '../../../e2e/pages/marketplace/CatalogPage';
import { ExperienceDetailPage, CartPage, BookingFormPage } from '../../../e2e/pages/marketplace/BookingFormPage';
import { SEED_EXPERIENCE_TITLE } from '../../../e2e/support/test-data';

const { Given, When, Then } = createBdd(test);

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Prioriza la experiencia semilla (siempre existe, ver globalSetup) y cae al primer resultado del catálogo */
async function openExperienceDetail(page: Page): Promise<string> {
  const catalog = new CatalogPage(page);
  await catalog.goto();

  const hasSeed = await page
    .locator(`a[href^="/experiences/"]:has-text("${SEED_EXPERIENCE_TITLE}")`)
    .isVisible({ timeout: 3_000 })
    .catch(() => false);

  if (hasSeed) {
    await catalog.clickExperienceByTitle(SEED_EXPERIENCE_TITLE);
    return SEED_EXPERIENCE_TITLE;
  }
  return catalog.clickFirstExperience();
}

// ── Camino feliz ────────────────────────────────────────────────────────

Given('que estoy en el catálogo del marketplace', async ({ page }) => {
  const catalog = new CatalogPage(page);
  await catalog.goto();
});

When('abro la primera experiencia disponible', async ({ page, world }) => {
  world.experienceTitle = await openExperienceDetail(page);
});

Then('veo el título de la experiencia en la página de detalle', async ({ page, world }) => {
  await expect(page.getByText(world.experienceTitle as string, { exact: false })).toBeVisible({ timeout: 8_000 });
});

Given('que estoy en la página de detalle de una experiencia', async ({ page, world }) => {
  world.experienceTitle = await openExperienceDetail(page);
  const detail = new ExperienceDetailPage(page);
  await detail.expectPriceVisible();
});

When('agrego la experiencia al carrito', async ({ page }) => {
  const detail = new ExperienceDetailPage(page);
  await detail.addToCart();
});

Then('el botón confirma que la experiencia quedó en el carrito', async ({ page }) => {
  await expect(page.getByRole('button', { name: /cupo.*en carrito/ })).toBeVisible({ timeout: 4_000 });
});

When('voy al carrito', async ({ page }) => {
  const detail = new ExperienceDetailPage(page);
  await detail.goToCart();
});

Then('veo la experiencia en el resumen de mi carrito', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.expectItemInCart();
});

When('continúo hacia el formulario de reserva', async ({ page }) => {
  const cart = new CartPage(page);
  await cart.goToBooking();
});

When('completo mis datos de invitado y acepto los términos', async ({ page, world }) => {
  const booking = new BookingFormPage(page);
  await booking.expectFormLoaded();
  await booking.selectDate(tomorrow());
  const guestEmail = `turista_e2e_bdd_${Date.now()}@test.nativago.com`;
  await booking.fillGuestData({ name: 'Turista E2E BDD', email: guestEmail, phone: '+57 300 000 9999' });
  await booking.acceptTerms();
  world.guestEmail = guestEmail;
  world.booking = booking;
});

When('confirmo la reserva', async ({ page, world }) => {
  const booking = (world.booking as BookingFormPage) ?? new BookingFormPage(page);
  await booking.submit();
  world.booking = booking;
});

Then('veo la confirmación {string}', async ({ page }, text: string) => {
  await expect(page.getByText(text)).toBeVisible({ timeout: 30_000 });
});

Then('veo mi email de confirmación en la pantalla', async ({ page, world }) => {
  await expect(page.getByText(world.guestEmail as string)).toBeVisible({ timeout: 5_000 });
});

// ── Caminos negativos: campos obligatorios del formulario de reserva ──

Given('que estoy en el formulario de reserva de una experiencia', async ({ page, world }) => {
  await openExperienceDetail(page);
  const detail = new ExperienceDetailPage(page);
  await detail.expectPriceVisible();
  await detail.addToCart();
  await detail.goToCart();

  const cart = new CartPage(page);
  await cart.expectItemInCart();
  await cart.goToBooking();

  const booking = new BookingFormPage(page);
  await booking.expectFormLoaded();
  world.booking = booking;
});

When('completo el formulario de reserva sin {string}', async ({ world }, campo: string) => {
  const booking = world.booking as BookingFormPage;

  if (campo !== 'la fecha') {
    await booking.selectDate(tomorrow());
  }

  if (campo === 'el nombre') {
    await booking.fillGuestDataPartial({ email: 'turista_bdd_negativo@test.nativago.com', phone: '+57 300 000 9999' });
  } else if (campo === 'el email') {
    await booking.fillGuestDataPartial({ name: 'Turista E2E BDD', phone: '+57 300 000 9999' });
  } else {
    await booking.fillGuestDataPartial({ name: 'Turista E2E BDD', email: 'turista_bdd_negativo@test.nativago.com', phone: '+57 300 000 9999' });
  }

  if (campo === 'la aceptación de términos') {
    await booking.acceptOnlyTermsCheckbox();
  } else {
    await booking.acceptTerms();
  }
});

Then('veo el mensaje de error {string}', async ({ page, world }, message: string) => {
  const booking = (world.booking as BookingFormPage) ?? new BookingFormPage(page);
  await booking.expectError(message);
});
