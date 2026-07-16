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
    // El precio del anticipo (15%) aparece en el sticky card de escritorio o en el CTA móvil
    await expect(this.page.locator('text=/Anticipo/')).toBeVisible({ timeout: 8_000 });
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
    await expect(this.page.getByText('Tu carrito')).toBeVisible({ timeout: 6_000 });
    // Debe haber al menos un botón de Reservar ahora
    await expect(this.page.getByText('Reservar ahora')).toBeVisible({ timeout: 6_000 });
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
    // El form usa componente <Input> que renderiza inputs estándar
    await this.page.locator('input[type="text"]').fill(guest.name);
    await this.page.locator('input[type="email"]').fill(guest.email);
    await this.page.locator('input[type="tel"]').fill(guest.phone);
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
