import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class CatalogPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/experiences');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText('Todas las experiencias')).toBeVisible({ timeout: 8_000 });
  }

  /**
   * Hace clic en la primera tarjeta de experiencia disponible.
   * Devuelve el título de la experiencia seleccionada.
   */
  async clickFirstExperience(): Promise<string> {
    // ExperienceCard renderiza un <Link> que tiene h3 con el título
    const cards = this.page.locator('a[href^="/experiences/"]').filter({
      has: this.page.locator('h3'),
    });
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
    const title = (await cards.first().locator('h3').textContent()) ?? '';
    await cards.first().click();
    await this.page.waitForLoadState('networkidle');
    return title.trim();
  }

  /** Hace clic en la tarjeta cuyo título coincida (substring match) */
  async clickExperienceByTitle(partialTitle: string) {
    const link = this.page.locator(`a[href^="/experiences/"]:has-text("${partialTitle}")`).first();
    await expect(link).toBeVisible({ timeout: 10_000 });
    await link.click();
    await this.page.waitForLoadState('networkidle');
  }
}
