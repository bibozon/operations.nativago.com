/**
 * NativaGo — Rol Soporte y equipos multi-usuario por operador
 *
 * S1  SuperAdmin crea un usuario Soporte → login → sidebar reducido
 *     (sin Ciudades/Categorías/Usuarios/Configuración)
 * T1  Operador ADMIN (agencia) agrega un miembro STAFF → login → llega a su
 *     dashboard, no ve "Equipo", y /admin/team lo redirige (no es ADMIN)
 */

import { test, expect } from '@playwright/test';
import { ADMIN, CMS_URL, makeOperadorCO } from './support/test-data';
import { OperatorRegisterPage } from './pages/cms/OperatorRegisterPage';
import { AdminVerificationPage } from './pages/cms/AdminVerificationPage';
import { ContractPage } from './pages/cms/ContractPage';

const uid = () => Math.random().toString(36).slice(2, 7);

test('S1. SuperAdmin crea Soporte → sidebar reducido', async ({ page }) => {
  const res = await page.request.post(`${CMS_URL}/api/auth/login`, {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  expect(res.status()).toBe(200);

  const email = `soporte_${Date.now()}_${uid()}@e2e.nativago.com`;

  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');
  await page.fill('input[name="name"]', `Soporte E2E ${uid()}`);
  await page.fill('input[name="email"]', email);
  await page.click('button:has-text("Crear usuario de soporte")');
  await page.waitForLoadState('networkidle');

  const password = (await page.locator('code').first().textContent())?.trim();
  expect(password).toBeTruthy();
  console.log('  ✓ S1a — Usuario Soporte creado');

  const loginRes = await page.request.post(`${CMS_URL}/api/auth/login`, {
    data: { email, password },
  });
  expect(loginRes.status()).toBe(200);

  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8_000 });

  const sidebar = page.locator('aside nav a');
  await expect(sidebar).toHaveCount(5);
  const labels = await sidebar.allTextContents();
  expect(labels).toEqual(['Dashboard', 'Experiencias', 'Reservas', 'Check-in QR', 'Operadores']);
  console.log('  ✓ S1b — Sidebar de Soporte tiene exactamente 5 ítems, sin Ciudades/Categorías/Usuarios/Configuración');
});

test('T1. Operador ADMIN agrega STAFF → STAFF con acceso limitado', async ({ browser }) => {
  const op = makeOperadorCO();
  const operatorEmail = op.email;
  const operatorPassword = op.password;

  const operadorCtx = await browser.newContext();
  const adminCtx = await browser.newContext();
  const operadorPage = await operadorCtx.newPage();
  const adminPage = await adminCtx.newPage();

  try {
    const registerPage = new OperatorRegisterPage(operadorPage);
    await registerPage.registerOperator({
      prestadorTipo: op.prestadorTipo,
      categoria: op.categoria,
      name: op.name,
      legalRep: op.legalRep,
      email: operatorEmail,
      phone: op.phone,
      password: operatorPassword,
      cityLabel: op.cityLabel,
      identityDoc: op.identityDoc,
      paymentAccount: op.paymentAccount,
    });

    const adminVerification = new AdminVerificationPage(adminPage);
    await adminVerification.loginAsAdmin();
    await adminVerification.goto();
    const approved = await adminVerification.approveOperator(op.name);
    expect(approved).toBe(true);

    await operadorPage.goto('/operator/dashboard');
    const contract = new ContractPage(operadorPage);
    await contract.accept();
    await expect(operadorPage).toHaveURL(/\/admin/, { timeout: 8_000 });
    console.log('  ✓ T1a — Operador (agencia) registrado, aprobado y con contrato aceptado');

    // ── ADMIN agrega un miembro STAFF ──────────────────────────────────
    const staffEmail = `staff_${Date.now()}_${uid()}@e2e.nativago.com`;
    await operadorPage.goto('/admin/team');
    await operadorPage.waitForLoadState('networkidle');
    await expect(operadorPage.getByRole('heading', { name: 'Equipo' })).toBeVisible({ timeout: 8_000 });

    await operadorPage.fill('input[name="name"]', `Staff E2E ${uid()}`);
    await operadorPage.fill('input[name="email"]', staffEmail);
    await operadorPage.click('button:has-text("Agregar miembro")');
    await operadorPage.waitForLoadState('networkidle');

    const staffPassword = (await operadorPage.locator('code').first().textContent())?.trim();
    expect(staffPassword).toBeTruthy();
    console.log('  ✓ T1b — Miembro STAFF agregado por el ADMIN del operador');

    // ── Login como STAFF en un contexto nuevo ──────────────────────────
    const staffCtx = await browser.newContext();
    const staffPage = await staffCtx.newPage();
    try {
      const loginRes = await staffPage.request.post(`${CMS_URL}/api/auth/login`, {
        data: { email: staffEmail, password: staffPassword },
      });
      expect(loginRes.status()).toBe(200);

      await staffPage.goto('/admin');
      await staffPage.waitForLoadState('networkidle');
      await expect(staffPage).toHaveURL(/\/admin\/agency/, { timeout: 8_000 });

      const sidebarLabels = await staffPage.locator('aside nav a').allTextContents();
      expect(sidebarLabels).not.toContain('Equipo');
      console.log('  ✓ T1c — STAFF llega a /admin/agency y no ve "Equipo" en el sidebar');

      // /admin/team es solo para el ADMIN del operador — a STAFF lo redirige
      await staffPage.goto('/admin/team');
      await staffPage.waitForLoadState('networkidle');
      await expect(staffPage).toHaveURL(/\/admin\/agency/, { timeout: 8_000 });
      console.log('  ✓ T1d — /admin/team redirige a STAFF (no es administrador del operador)');
    } finally {
      await staffCtx.close();
    }
  } finally {
    await operadorCtx.close();
    await adminCtx.close();
  }
});
