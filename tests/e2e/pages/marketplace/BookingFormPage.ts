import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface GuestData {
  name:  string;
  email: string;
  phone: string;
}

export class ExperienceDetailPage {
  constructor(private readonly page: Page) {}

  async expectPriceVisible() {
    // El precio del anticipo (15%) aparece en el sticky card de escritorio o en el CTA móvil;
    // ambos existen en el DOM a la vez, solo uno es visible según el viewport. El regex exige
    // el paréntesis para no matchear las tarjetas de "experiencias relacionadas" (que muestran
    // "Anticipo 15%" sin paréntesis, una por cada experiencia listada).
    await expect(
      this.page.locator('text=/Anticipo \\(15%\\)/').filter({ visible: true })
    ).toBeVisible({ timeout: 8_000 });
  }

  async addToCart() {
    const btn = this.page.getByRole('button', { name: /Agregar al carrito/ }).first();
    await expect(btn).toBeVisible({ timeout: 6_000 });
    await btn.click();
    // Esperar feedback visual ("Agregado al carrito")
    await expect(this.page.getByRole('button', { name: /Agregado/ })).toBeVisible({ timeout: 4_000 });
  }

  async goToCart() {
    await this.page.goto('/carrito');
    await this.page.waitForLoadState('networkidle');
  }
}

export class CartPage {
  constructor(private readonly page: Page) {}

  async expectItemInCart() {
    await expect(this.page.getByRole('heading', { name: 'Tu carrito' })).toBeVisible({ timeout: 6_000 });
    // Debe haber al menos un botón de Reservar ahora
    await expect(this.page.getByRole('main').getByText('Reservar ahora').first()).toBeVisible({ timeout: 6_000 });
  }

  /** Hace clic en el primer enlace "Reservar ahora" y espera la carga del form */
  async goToBooking() {
    const reservarLink = this.page.locator('a:has-text("Reservar ahora")').first();
    await expect(reservarLink).toBeVisible({ timeout: 6_000 });
    await reservarLink.click();
    await this.page.waitForLoadState('networkidle');
  }
}

export class BookingFormPage {
  constructor(private readonly page: Page) {}

  async expectFormLoaded() {
    await this.page.waitForURL(/\/experiences\/.+\/reservar/, { timeout: 10_000 });
    await this.page.waitForLoadState('networkidle');
  }

  async selectDate(isoDate: string) {
    // isoDate formato: "YYYY-MM-DD"
    await this.page.locator('input[type="date"]').fill(isoDate);
  }

  async fillGuestData(guest: GuestData) {
    // El form usa componente <Input> que renderiza inputs estándar. Hay un
    // modal de login ("Acceso viajeros") montado con campos duplicados
    // (fuera de <main>) — se acota a <main> para evitar el strict mode.
    const main = this.page.getByRole('main');
    await main.locator('input[type="text"]').fill(guest.name);
    await main.locator('input[type="email"]').fill(guest.email);
    await main.locator('input[type="tel"]').fill(guest.phone);
  }

  async acceptTerms() {
    const checkboxes = this.page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }
  }

  async submit() {
    const btn = this.page.getByRole('button', { name: /Reservar/ });
    await expect(btn).toBeVisible({ timeout: 5_000 });
    await btn.click();
  }

  async expectConfirmation() {
    await expect(this.page.getByText('¡Reserva registrada!')).toBeVisible({ timeout: 30_000 });
  }

  async confirmationEmail() {
    const emailEl = this.page.locator('span.font-bold.text-\\[\\#0F172A\\]').first();
    return emailEl.textContent();
  }
}
