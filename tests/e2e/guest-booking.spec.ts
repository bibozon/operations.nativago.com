/**
 * NativaGo — Flujo: usuario invitado reserva una actividad
 *
 * M1  Navega al catálogo del Marketplace
 * M2  Abre la primera experiencia disponible
 * M3  Agrega al carrito (anticipo 15%)
 * M4  Va al carrito y confirma resumen
 * M5  Completa el formulario de reserva como invitado
 * M6  Recibe confirmación de reserva
 *
 * El Marketplace debe estar corriendo en localhost:3000.
 * El CMS debe estar corriendo en localhost:3001 (provee el catálogo y las reservas).
 */

import { test, expect } from '@playwright/test';
import { CatalogPage }                         from './pages/marketplace/CatalogPage';
import { ExperienceDetailPage, CartPage, BookingFormPage } from './pages/marketplace/BookingFormPage';
import { SEED_EXPERIENCE_TITLE }               from './support/test-data';

// Fecha de mañana en formato YYYY-MM-DD
function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

test.describe.serial('M — Invitado reserva una actividad', () => {

  test('M1–M2. Catálogo: navegar y abrir experiencia', async ({ page }) => {
    const catalog = new CatalogPage(page);
    await catalog.goto();

    // Intenta ir directo a la experiencia semilla si está disponible; si no, toma la primera
    const hasSeed = await page
      .locator(`a[href^="/experiences/"]:has-text("${SEED_EXPERIENCE_TITLE}")`)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    let title: string;
    if (hasSeed) {
      await catalog.clickExperienceByTitle(SEED_EXPERIENCE_TITLE);
      title = SEED_EXPERIENCE_TITLE;
    } else {
      title = await catalog.clickFirstExperience();
    }

    // En la página de detalle debe aparecer el título y el precio
    await expect(page.getByText(title, { exact: false })).toBeVisible({ timeout: 8_000 });
    console.log(`✓ Experiencia seleccionada: "${title}"`);
  });

  test('M3. Detalle: agregar al carrito', async ({ page }) => {
    // Navegar directo a la experiencia semilla para no depender del estado anterior
    const catalog = new CatalogPage(page);
    await catalog.goto();

    const hasSeed = await page
      .locator(`a[href^="/experiences/"]:has-text("${SEED_EXPERIENCE_TITLE}")`)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (hasSeed) {
      await catalog.clickExperienceByTitle(SEED_EXPERIENCE_TITLE);
    } else {
      await catalog.clickFirstExperience();
    }

    const detail = new ExperienceDetailPage(page);
    await detail.expectPriceVisible();
    await detail.addToCart();
    console.log('✓ Actividad agregada al carrito');
  });

  test('M4–M6. Carrito → formulario de reserva → confirmación', async ({ page }) => {
    // Ruta completa: agrega al carrito desde la UI y hace checkout como invitado
    const catalog = new CatalogPage(page);
    await catalog.goto();

    const hasSeed = await page
      .locator(`a[href^="/experiences/"]:has-text("${SEED_EXPERIENCE_TITLE}")`)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (hasSeed) {
      await catalog.clickExperienceByTitle(SEED_EXPERIENCE_TITLE);
    } else {
      await catalog.clickFirstExperience();
    }

    const detail = new ExperienceDetailPage(page);
    await detail.expectPriceVisible();
    await detail.addToCart();

    // Ir al carrito
    const cart = new CartPage(page);
    await detail.goToCart();
    await cart.expectItemInCart();
    await cart.goToBooking();

    // Formulario de reserva
    const booking = new BookingFormPage(page);
    await booking.expectFormLoaded();
    await booking.selectDate(tomorrow());
    await booking.fillGuestData({
      name:  'Turista E2E',
      email: 'turista_e2e@test.nativago.com',
      phone: '+57 300 000 9999',
    });
    await booking.acceptTerms();
    await booking.submit();

    // Confirmación
    await booking.expectConfirmation();
    console.log('✓ Reserva confirmada como invitado');

    // Verificar que se muestra el email del guest
    await expect(page.getByText('turista_e2e@test.nativago.com')).toBeVisible({ timeout: 5_000 });
  });

});
