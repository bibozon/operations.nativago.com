import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { CMS_URL, makeOperadorCO } from '../../../e2e/support/test-data';
import { OperatorRegisterPage } from '../../../e2e/pages/cms/OperatorRegisterPage';
import { AdminVerificationPage } from '../../../e2e/pages/cms/AdminVerificationPage';
import { ContractPage } from '../../../e2e/pages/cms/ContractPage';

const { Given, When, Then } = createBdd(test);

const uid = () => Math.random().toString(36).slice(2, 7);

const ADMIN_SECTIONS: Record<string, string> = {
  'equipo':      '/admin/team',
  'categorías':  '/admin/categories',
};

// ── Soporte ─────────────────────────────────────────────────────────────

When('creo un nuevo usuario de Soporte', async ({ page, world }) => {
  const email = `soporte_${Date.now()}_${uid()}@e2e.nativago.com`;
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="name"]', `Soporte E2E ${uid()}`);
  await page.fill('input[name="email"]', email);
  await page.click('button:has-text("Crear usuario de soporte")');
  await page.waitForLoadState('networkidle');

  const password = (await page.locator('code').first().textContent())?.trim();
  expect(password).toBeTruthy();

  world.supportEmail = email;
  world.supportPassword = password;
});

When('inicio sesión con las credenciales de ese usuario de Soporte', async ({ page, world }) => {
  const res = await page.request.post(`${CMS_URL}/api/auth/login`, {
    data: { email: world.supportEmail, password: world.supportPassword },
  });
  expect(res.status()).toBe(200);
});

Then('llego al dashboard de administración', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8_000 });
});

Then('el sidebar de Soporte muestra exactamente los ítems {string}', async ({ page }, itemsCsv: string) => {
  const expected = itemsCsv.split(',').map((s) => s.trim());
  const sidebar = page.locator('aside nav a');
  await expect(sidebar).toHaveCount(expected.length);
  const labels = await sidebar.allTextContents();
  expect(labels).toEqual(expected);
});

// ── Equipo de operador ──────────────────────────────────────────────────

Given('que tengo una cuenta de operador agencia aprobada y con contrato aceptado', async ({ page, browser, world }) => {
  const op = makeOperadorCO(); // JURIDICA → AGENCY
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

  const adminCtx  = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  const adminVerification = new AdminVerificationPage(adminPage);
  await adminVerification.loginAsAdmin();
  await adminVerification.goto();
  const approved = await adminVerification.approveOperator(op.name);
  expect(approved).toBe(true);
  await adminCtx.close();

  await page.goto('/operator/dashboard');
  const contract = new ContractPage(page);
  await contract.accept();
  await expect(page).toHaveURL(/\/admin/, { timeout: 8_000 });

  world.operator = op;
});

When('agrego un miembro STAFF a mi equipo', async ({ page, world }) => {
  const staffEmail = `staff_${Date.now()}_${uid()}@e2e.nativago.com`;
  await page.goto('/admin/team');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Equipo' })).toBeVisible({ timeout: 8_000 });

  await page.fill('input[name="name"]', `Staff E2E ${uid()}`);
  await page.fill('input[name="email"]', staffEmail);
  await page.click('button:has-text("Agregar miembro")');
  await page.waitForLoadState('networkidle');

  const staffPassword = (await page.locator('code').first().textContent())?.trim();
  expect(staffPassword).toBeTruthy();

  world.staffEmail = staffEmail;
  world.staffPassword = staffPassword;
});

When('inicio sesión con las credenciales de ese miembro STAFF', async ({ page, world }) => {
  const res = await page.request.post(`${CMS_URL}/api/auth/login`, {
    data: { email: world.staffEmail, password: world.staffPassword },
  });
  expect(res.status()).toBe(200);
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
});

Then('el miembro STAFF llega al panel de su operador', async ({ page }) => {
  await expect(page).toHaveURL(/\/admin\/agency/, { timeout: 8_000 });
});

Then('el miembro STAFF no ve {string} en su sidebar', async ({ page }, label: string) => {
  const sidebarLabels = await page.locator('aside nav a').allTextContents();
  expect(sidebarLabels).not.toContain(label);
});

// ── Control de acceso por rol ───────────────────────────────────────────

When('intento ir a la administración de {string}', async ({ page }, section: string) => {
  const url = ADMIN_SECTIONS[section];
  if (!url) throw new Error(`Sección de administración desconocida: "${section}"`);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
});

Then('soy redirigido fuera de la administración de {string}', async ({ page }, section: string) => {
  const url = ADMIN_SECTIONS[section];
  await expect(page).not.toHaveURL(new RegExp(`${url}$`));
});
