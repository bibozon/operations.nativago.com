import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import {
  makeOperadorCO,
  makeOperadorCONatural,
  makeOperadorBR,
  makeOperadorBRJuridica,
  type OperadorData,
} from '../../../e2e/support/test-data';
import { OperatorRegisterPage } from '../../../e2e/pages/cms/OperatorRegisterPage';
import { OperatorDashboardPage, type DashboardStatus } from '../../../e2e/pages/cms/OperatorDashboardPage';
import { AdminVerificationPage } from '../../../e2e/pages/cms/AdminVerificationPage';
import { ContractPage } from '../../../e2e/pages/cms/ContractPage';
import { ExperienceFormPage } from '../../../e2e/pages/cms/ExperienceFormPage';

const { Given, When, Then, After } = createBdd(test);

const PROFILES: Record<string, () => OperadorData> = {
  'CO jurídica': makeOperadorCO,
  'CO natural':  makeOperadorCONatural,
  'BR natural':  makeOperadorBR,
  'BR jurídica': makeOperadorBRJuridica,
};

/** Rellena todos los campos del registro salvo nombre y contraseña (los controla el llamador) */
async function fillCommonFields(registerPage: OperatorRegisterPage, base: OperadorData) {
  await registerPage.selectPrestadorTipo(base.prestadorTipo);
  await registerPage.selectCategoria(base.categoria);
  await registerPage.fillEmail(base.email);
  await registerPage.fillPhone(base.phone);
  await registerPage.selectCity(base.cityLabel);
  await registerPage.waitForDocumentSection();
  await registerPage.fillIdentityDocument(base.identityDoc);
  await registerPage.fillRequiredDocumentFields(base.identityDoc);
  if (base.paymentAccount) await registerPage.fillPaymentAccount(base.paymentAccount);
  await registerPage.acceptLiability();
}

After(async ({ world }) => {
  if (world.adminCtx) await world.adminCtx.close();
});

// ── Camino feliz: registro → aprobación → contrato → primera experiencia ──

Given('los datos de un nuevo operador con perfil {string}', async ({ world }, perfil: string) => {
  const factory = PROFILES[perfil];
  if (!factory) throw new Error(`Perfil de operador desconocido: "${perfil}"`);
  world.operator = factory();
});

When('completo el formulario de registro de operador con esos datos', async ({ page, world }) => {
  const op = world.operator as OperadorData;
  const registerPage = new OperatorRegisterPage(page);
  await registerPage.registerOperator({
    country:        op.country,
    prestadorTipo:  op.prestadorTipo,
    categoria:      op.categoria,
    name:           op.name,
    legalRep:       op.legalRep,
    email:          op.email,
    phone:          op.phone,
    password:       op.password,
    cityLabel:      op.cityLabel,
    identityDoc:    op.identityDoc,
    paymentAccount: op.paymentAccount,
  });
  world.registerPage = registerPage;
});

Then('llego a mi panel de operador con estado {string} y progreso mayor a 0%', async ({ page, world }, status: string) => {
  const dashboard = new OperatorDashboardPage(page);
  await dashboard.expectStatus(status as DashboardStatus);
  const pct = await dashboard.progressPercent();
  expect(pct).toBeGreaterThan(0);
  world.dashboard = dashboard;
});

When('envío mi cuenta para revisión', async ({ page, world }) => {
  const dashboard = (world.dashboard as OperatorDashboardPage) ?? new OperatorDashboardPage(page);
  await dashboard.submitForReview();
  world.dashboard = dashboard;
});

Then('mi panel muestra el estado {string}', async ({ page, world }, status: string) => {
  const dashboard = (world.dashboard as OperatorDashboardPage) ?? new OperatorDashboardPage(page);
  await dashboard.expectStatus(status as DashboardStatus);
});

When('el equipo de NativaGo aprueba mi cuenta', async ({ browser, world }) => {
  const adminCtx  = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  const adminVerification = new AdminVerificationPage(adminPage);
  await adminVerification.loginAsAdmin();
  await adminVerification.goto();
  const approved = await adminVerification.approveOperator((world.operator as OperadorData).name);
  expect(approved).toBe(true);
  world.adminCtx = adminCtx;
});

When('el equipo de NativaGo me pide información adicional con la nota {string}', async ({ page, browser, world }, notes: string) => {
  const adminCtx  = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  const adminVerification = new AdminVerificationPage(adminPage);
  await adminVerification.loginAsAdmin();
  await adminVerification.goto();
  await adminVerification.requestInfo((world.operator as OperadorData).name, notes);
  world.adminCtx = adminCtx;
  // El operador refresca su panel para ver el nuevo estado
  await page.goto('/operator/dashboard');
  await page.waitForLoadState('networkidle');
});

Then('mi panel muestra la nota {string}', async ({ page, world }, notes: string) => {
  const dashboard = (world.dashboard as OperatorDashboardPage) ?? new OperatorDashboardPage(page);
  await dashboard.expectReviewNotes(notes);
});

When('vuelvo a mi panel de operador', async ({ page }) => {
  await page.goto('/operator/dashboard');
});

When('acepto el contrato de intermediación', async ({ page }) => {
  const contract = new ContractPage(page);
  await contract.accept();
});

Then('llego al panel completo de operador', async ({ page }) => {
  await expect(page).toHaveURL(/\/admin/, { timeout: 8_000 });
});

When('publico mi primera experiencia con los datos del perfil', async ({ page, world }) => {
  const expForm = new ExperienceFormPage(page);
  await expForm.createExperience((world.operator as OperadorData).experience);
  world.expForm = expForm;
});

Then('la experiencia aparece en la lista de mi panel', async ({ page, world }) => {
  const expForm = (world.expForm as ExperienceFormPage) ?? new ExperienceFormPage(page);
  await expForm.expectExperienceInList((world.operator as OperadorData).experience.title);
});

// ── Caminos negativos: validación del formulario de registro ──

Given('que estoy en el formulario de registro de operador', async ({ page, world }) => {
  const registerPage = new OperatorRegisterPage(page);
  await registerPage.goto();
  world.registerPage = registerPage;
});

When('completo el formulario de registro dejando el nombre vacío', async ({ world }) => {
  const base = makeOperadorCONatural();
  const registerPage = world.registerPage as OperatorRegisterPage;
  await fillCommonFields(registerPage, base);
  await registerPage.fillPassword(base.password);
  // El nombre se deja deliberadamente sin completar.
});

When('completo el formulario de registro con la contraseña {string}', async ({ world }, password: string) => {
  const base = makeOperadorCONatural();
  const registerPage = world.registerPage as OperatorRegisterPage;
  await registerPage.fillName(base.name);
  await fillCommonFields(registerPage, base);
  await registerPage.fillPassword(password);
});

When('envío el formulario de registro', async ({ page, world }) => {
  // El form tiene required/minLength nativos del navegador (UX), que
  // bloquearían el submit antes de llegar al servidor. Para probar la
  // validación DEL SERVIDOR (la fuente de verdad) hay que quitarlos primero.
  await page.evaluate(() => {
    document.querySelectorAll('[required]').forEach((el) => el.removeAttribute('required'));
    document.querySelectorAll('[minlength]').forEach((el) => el.removeAttribute('minlength'));
  });
  await (world.registerPage as OperatorRegisterPage).submit();
});

Given('que ya existe una cuenta de operador registrada', async ({ page, world }) => {
  const base = makeOperadorCONatural();
  const registerPage = new OperatorRegisterPage(page);
  await registerPage.registerOperator({
    country:        base.country,
    prestadorTipo:  base.prestadorTipo,
    categoria:      base.categoria,
    name:           base.name,
    email:          base.email,
    phone:          base.phone,
    password:       base.password,
    cityLabel:      base.cityLabel,
    identityDoc:    base.identityDoc,
    paymentAccount: base.paymentAccount,
  });
  world.existingEmail = base.email;
});

When('intento registrar un nuevo operador con ese mismo email', async ({ page, world }) => {
  const other = makeOperadorCONatural();
  const registerPage = new OperatorRegisterPage(page);
  await registerPage.goto();
  await registerPage.selectPrestadorTipo(other.prestadorTipo);
  await registerPage.selectCategoria(other.categoria);
  await registerPage.fillName(other.name);
  await registerPage.fillEmail(world.existingEmail as string);
  await registerPage.fillPhone(other.phone);
  await registerPage.fillPassword(other.password);
  await registerPage.selectCity(other.cityLabel);
  await registerPage.waitForDocumentSection();
  await registerPage.fillIdentityDocument(other.identityDoc);
  await registerPage.fillRequiredDocumentFields(other.identityDoc);
  if (other.paymentAccount) await registerPage.fillPaymentAccount(other.paymentAccount);
  await registerPage.acceptLiability();
  world.registerPage = registerPage;
});

When('voy a la página de crear una nueva experiencia', async ({ page }) => {
  await page.goto('/admin/experiences/new');
  await page.waitForLoadState('networkidle');
});

Then('veo el mensaje {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible({ timeout: 6_000 });
});

Then('no veo el formulario de creación de experiencias', async ({ page }) => {
  // Un operador DRAFT nunca llega al form de creación (título es un campo
  // exclusivo de ese form): requireOperator() lo intercepta antes por
  // contractAccepted=false y lo manda a /legal/operador/aceite, que tiene
  // su propio <form> (aceptar contrato) — por eso no basta con "sin form".
  await expect(page.locator('input[name="title"]')).not.toBeVisible({ timeout: 6_000 });
});
