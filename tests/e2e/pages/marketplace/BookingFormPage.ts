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
    // El copy actual del CTA de precio es "Anticipo 15%" (sin paréntesis) —
    // el mismo texto que usan las tarjetas de "experiencias relacionadas"
    // más abajo en la página. .first() alcanza porque el CTA del detalle
    // siempre aparece antes en el DOM que esa sección.
    await expect(
      this.page.locator('text=/Anticipo 15%/').first()
    ).toBeVisible({ timeout: 8_000 });
  }

  async addToCart() {
    const btn = this.page.getByRole('button', { name: /Agregar al carrito/ }).first();
    await expect(btn).toBeVisible({ timeout: 6_000 });
    await btn.click();
    // Tras agregar, AddToCartButton cambia a un botón "N cupo(s) en carrito · Ver carrito →"
    await expect(this.page.getByRole('button', { name: /cupo.*en carrito/ })).toBeVisible({ timeout: 4_000 });
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

  /** Rellena solo los campos indicados de guest (para casos negativos de campo faltante) */
  async fillGuestDataPartial(guest: Partial<GuestData>) {
    const main = this.page.getByRole('main');
    if (guest.name  !== undefined) await main.locator('input[type="text"]').fill(guest.name);
    if (guest.email !== undefined) await main.locator('input[type="email"]').fill(guest.email);
    if (guest.phone !== undefined) await main.locator('input[type="tel"]').fill(guest.phone);
  }

  async acceptTerms() {
    const checkboxes = this.page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }
  }

  /** Marca solo "Términos" y deja "Privacidad" sin marcar (caso negativo) */
  async acceptOnlyTermsCheckbox() {
    await this.page.locator('input[type="checkbox"]').nth(0).check();
  }

  async submit() {
    const btn = this.page.getByRole('button', { name: /Reservar/ });
    await expect(btn).toBeVisible({ timeout: 5_000 });
    await btn.click();
  }

  async expectError(text: string) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 5_000 });
  }

  async expectConfirmation() {
    await expect(this.page.getByText('¡Reserva registrada!')).toBeVisible({ timeout: 30_000 });
  }

  async confirmationEmail() {
    const emailEl = this.page.locator('span.font-bold.text-\\[\\#0F172A\\]').first();
    return emailEl.textContent();
  }
}
