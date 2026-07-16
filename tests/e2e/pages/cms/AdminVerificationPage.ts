import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { ADMIN, CMS_URL } from '../../support/test-data';

export class AdminVerificationPage {
  constructor(private readonly page: Page) {}

  async loginAsAdmin() {
    const res = await this.page.request.post(`${CMS_URL}/api/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    expect(res.status()).toBe(200);
  }

  async goto() {
    await this.page.goto('/admin/operators/verification');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText('Verificación de operadores')).toBeVisible({ timeout: 8_000 });
  }

  /** Aprueba al operador con el nombre dado. Devuelve false si no lo encuentra. */
  async approveOperator(operatorName: string): Promise<boolean> {
    const row = this.page.locator('tr', { hasText: operatorName });
    const visible = await row.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!visible) return false;

    const approveForm = row.locator('form').filter({
      has: this.page.locator('input[value="approve"]'),
    });
    await approveForm.locator('button[type="submit"]').click();
    await this.page.waitForLoadState('networkidle');
    return true;
  }

  /** Pide información adicional al operador (INFO_NEEDED + nota) */
  async requestInfo(operatorName: string, notes: string) {
    const row = this.page.locator('tr', { hasText: operatorName });
    await row.locator('textarea[name="reviewNotes"]').fill(notes);
    const infoForm = row.locator('form').filter({
      has: this.page.locator('input[value="request_info"]'),
    });
    await infoForm.locator('button[type="submit"]').click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectOperatorAbsent(operatorName: string) {
    await expect(this.page.locator('tr', { hasText: operatorName })).not.toBeVisible({ timeout: 6_000 });
  }
}
