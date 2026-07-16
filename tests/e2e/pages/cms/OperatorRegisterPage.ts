import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export class OperatorRegisterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/register/operator');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText('Registro de operador')).toBeVisible({ timeout: 8_000 });
  }

  async selectPrestadorTipo(tipo: 'NATURAL' | 'JURIDICA') {
    const label = tipo === 'NATURAL' ? 'Persona natural' : 'Persona jurídica';
    await this.page.locator('button', { hasText: label }).first().click();
  }

  async selectCategoria(value: string) {
    await this.page.selectOption('select[name="categoria"]', { value });
  }

  async fillName(name: string) {
    await this.page.fill('input[name="name"]', name);
  }

  async fillLegalRepresentative(name: string) {
    await this.page.fill('input[name="legalRepresentative"]', name);
  }

  async fillEmail(email: string) {
    await this.page.fill('input[type="email"]', email);
  }

  async fillPhone(phone: string) {
    await this.page.fill('input[name="phone"]', phone);
  }

  async fillPassword(password: string) {
    await this.page.fill('input[name="password"]', password);
  }

  async selectCity(cityLabel: string) {
    await this.page.selectOption('select[name="cityId"]', { label: cityLabel });
  }

  /** Espera a que aparezca la sección de identidad/documentos (se muestra al elegir ciudad) */
  async waitForDocumentSection() {
    await this.page
      .locator('input[name="identityDocumentNumber"]')
      .waitFor({ state: 'visible', timeout: 8_000 });
  }

  async fillIdentityDocument(value: string) {
    await this.page.fill('input[name="identityDocumentNumber"]', value);
  }

  /** Rellena campos de documento dinámicos (doc_{uuid}) que sean required */
  async fillRequiredDocumentFields(value: string) {
    const inputs = this.page.locator('input[name^="doc_"][required]');
    const count  = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).fill(value);
    }
  }

  async fillPaymentAccount(value: string) {
    await this.page.fill('input[name="paymentAccount"]', value);
  }

  async acceptLiability() {
    await this.page.check('#liabilityAccepted');
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  async errorMessage() {
    return this.page.locator('[class*="text-red"]').first().textContent();
  }

  /** Flujo completo de registro. Devuelve cuando la página redirecciona a /operator/dashboard */
  async registerOperator(data: {
    prestadorTipo: 'NATURAL' | 'JURIDICA';
    categoria: string;
    name: string;
    legalRep?: string;
    email: string;
    phone: string;
    password: string;
    cityLabel: string;
    identityDoc: string;
    paymentAccount?: string;
  }) {
    await this.goto();
    await this.selectPrestadorTipo(data.prestadorTipo);
    await this.selectCategoria(data.categoria);
    await this.fillName(data.name);
    if (data.legalRep) await this.fillLegalRepresentative(data.legalRep);
    await this.fillEmail(data.email);
    await this.fillPhone(data.phone);
    await this.fillPassword(data.password);
    await this.selectCity(data.cityLabel);
    await this.waitForDocumentSection();
    await this.fillIdentityDocument(data.identityDoc);
    await this.fillRequiredDocumentFields(data.identityDoc);
    if (data.paymentAccount) await this.fillPaymentAccount(data.paymentAccount);
    await this.acceptLiability();
    await Promise.all([
      this.page.waitForURL('/operator/dashboard', { timeout: 25_000 }),
      this.submit(),
    ]);
  }
}
