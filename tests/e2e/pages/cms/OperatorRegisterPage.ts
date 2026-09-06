import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const PAGE_TITLE_BY_COUNTRY: Record<string, string> = {
  co: 'Registro de operador turístico',
  br: 'Cadastro de operador turístico',
  mx: 'Registro de operador turístico',
};

export class OperatorRegisterPage {
  constructor(private readonly page: Page) {}

  /**
   * El registro es por país desde /register/operator (selector de país) →
   * /register/{co|br|mx}/operator (formulario ya filtrado a ese país) — se
   * navega directo a la ruta del país para no depender del click en la
   * tarjeta, salvo que un escenario quiera probar el selector en sí.
   */
  async goto(country: 'co' | 'br' | 'mx' = 'co') {
    await this.page.goto(`/register/${country}/operator`);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByText(PAGE_TITLE_BY_COUNTRY[country])).toBeVisible({ timeout: 8_000 });
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
    country?: 'co' | 'br' | 'mx';
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
    await this.goto(data.country ?? 'co');
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
