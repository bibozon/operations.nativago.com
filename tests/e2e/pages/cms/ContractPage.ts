import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class ContractPage {
  constructor(private readonly page: Page) {}

  async accept() {
    await this.page.waitForURL('/legal/operador/aceite', { timeout: 10_000 });
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText('Aceite do Contrato')).toBeVisible({ timeout: 6_000 });
    await this.page.check('input[name="accept"]');
    await Promise.all([
      this.page.waitForURL('/admin', { timeout: 15_000 }),
      this.page.click('button[type="submit"]'),
    ]);
  }
}
