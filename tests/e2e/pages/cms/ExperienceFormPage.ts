import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface ExperienceData {
  title:           string;
  description:     string;
  durationMinutes: string;
  price:           string;
}

export class ExperienceFormPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/admin/experiences/new');
    await this.page.waitForLoadState('networkidle');
  }

  async expectApprovedForm() {
    await expect(this.page.getByRole('heading', { name: 'Crear experiencia' })).toBeVisible({ timeout: 6_000 });
    // Si el operador no está aprobado, la página muestra un mensaje en lugar del form
    await expect(this.page.locator('form')).toBeVisible({ timeout: 6_000 });
  }

  async fillExperience(data: ExperienceData) {
    await this.page.fill('input[name="title"]',         data.title);
    await this.page.fill('textarea[name="description"]', data.description);
    await this.page.fill('input[name="durationMinutes"]', data.durationMinutes);
    await this.page.fill('input[name="price"]',          data.price);
  }

  /** Selecciona la primera opción disponible del select de ciudad */
  async selectFirstCity() {
    const citySelect = this.page.locator('select[name="cityId"]');
    const options    = await citySelect.locator('option').all();
    // El primer option siempre es el placeholder vacío ("Selecciona una ciudad")
    if (options.length > 1) {
      const value = await options[1].getAttribute('value');
      if (value) await citySelect.selectOption({ value });
    }
  }

  /** Selecciona la primera categoría disponible */
  async selectFirstCategory() {
    const catSelect = this.page.locator('select[name="categoryId"]');
    const options   = await catSelect.locator('option').all();
    if (options.length > 1) {
      const value = await options[1].getAttribute('value');
      if (value) await catSelect.selectOption({ value });
    }
  }

  async submit() {
    await Promise.all([
      this.page.waitForURL('/admin/experiences', { timeout: 20_000 }),
      this.page.click('button[type="submit"]'),
    ]);
  }

  /** Flujo completo: rellena y publica la experiencia */
  async createExperience(data: ExperienceData) {
    await this.goto();
    await this.expectApprovedForm();
    await this.fillExperience(data);
    await this.selectFirstCity();
    await this.selectFirstCategory();
    await this.submit();
  }

  /** Confirma que la experiencia recién creada aparece en la lista */
  async expectExperienceInList(title: string) {
    await expect(this.page.getByText(title)).toBeVisible({ timeout: 8_000 });
  }
}
