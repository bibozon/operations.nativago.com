import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export type DashboardStatus = 'DRAFT' | 'PENDING' | 'INFO_NEEDED' | 'APPROVED' | 'SUSPENDED';

const STATUS_TEXT: Record<DashboardStatus, string> = {
  DRAFT:       'Tu cuenta está siendo configurada',
  PENDING:     'Tu cuenta está en revisión',
  INFO_NEEDED: 'Necesitamos información adicional',
  APPROVED:    '¡Tu cuenta fue aprobada!',
  SUSPENDED:   'Tu cuenta está suspendida',
};

export class OperatorDashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/operator/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async expectStatus(status: DashboardStatus) {
    await expect(this.page.getByText(STATUS_TEXT[status])).toBeVisible({ timeout: 8_000 });
  }

  async submitForReview() {
    const btn = this.page.getByRole('button', { name: /Enviar para revisión/ });
    await expect(btn).toBeVisible({ timeout: 5_000 });
    await btn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectReviewNotes(text: string) {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 5_000 });
  }

  async progressPercent(): Promise<number> {
    const text = await this.page.locator('text=/\\d+%/').first().textContent();
    return parseInt(text?.replace('%', '') ?? '0', 10);
  }
}
