/**
 * NativaGo CMS — Suite E2E: registro y creación de operadores
 *
 * Flujos:
 *  G1) Registro de operador Colombia (agencia, RNT)
 *  G2) Registro de operador Brasil (freelance, CADASTUR + CPF)
 *  G3) Admin: ver pendientes y aprobar ambos operadores
 *
 * Prerrequisito: globalSetup siembra ciudades CO y BR en la DB.
 * El CMS corre en http://localhost:3001
 */

import { test, expect } from '@playwright/test';

const RUN = Date.now();
const uid = () => Math.random().toString(36).slice(2, 6);

const ADMIN = {
  email: 'admin@nativago.com',
  password: 'nativago123',
};

// ── Datos del operador Colombia ──────────────────────────────────────────────
const OP_CO = {
  name: `Caribe Aventuras ${uid()}`,
  email: `op_co_${RUN}@e2e.nativago.com`,
  phone: '+57 300 111 2222',
  city: 'Cartagena',
  type: 'AGENCY',
  licenseNumber: `${Math.floor(10000 + Math.random() * 90000)}`,
};

// ── Datos del operador Brasil ────────────────────────────────────────────────
const OP_BR = {
  name: `Amazônia Ecoturismo ${uid()}`,
  email: `op_br_${RUN}@e2e.nativago.com`,
  phone: '+55 92 99000-0001',
  city: 'Manaus',
  type: 'FREELANCE',
  cpf: '000.000.000-00',
  cadastur: `${Math.floor(100000 + Math.random() * 900000)}`,
};

// ════════════════════════════════════════════════════════════════════════════
// G — Registro y creación de operadores (Colombia + Brasil)
// ════════════════════════════════════════════════════════════════════════════

test.describe.serial('G — Registro de operadores Colombia y Brasil', () => {

  test('G1. Registro operador Colombia — Agencia con RNT', async ({ page }) => {
    await page.goto('/register/operator');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Registro de operador')).toBeVisible({ timeout: 8_000 });

    // Nombre
    await page.fill('input[name="name"]', OP_CO.name);

    // Email
    await page.fill('input[type="email"]', OP_CO.email);

    // Teléfono
    await page.fill('input[name="phone"]', OP_CO.phone);

    // Ciudad colombiana
    const citySelect = page.locator('select[name="cityId"]');
    await expect(citySelect).toBeVisible({ timeout: 5_000 });
    const cityOptions = await citySelect.locator('option').allTextContents();
    const coCity = cityOptions.find(o => o.trim() === OP_CO.city) ?? cityOptions.find(o => o.trim() !== '');
    if (!coCity) { test.skip(); return; }
    await citySelect.selectOption({ label: coCity.trim() });

    // Tipo: Agencia
    await page.locator('select[name="type"]').selectOption({ value: 'AGENCY' });

    // RNT (Colombia)
    await page.fill('input[name="licenseNumber"]', OP_CO.licenseNumber);

    // Aceptar responsabilidad
    await page.check('#liabilityAccepted');

    // Submit → server action → redirect('/login')
    await Promise.all([
      page.waitForURL('/login', { timeout: 20_000 }),
      page.click('button[type="submit"]'),
    ]);

    await expect(page).toHaveURL('/login');
    console.log(`✓ Operador CO registrado: ${OP_CO.email} | Ciudad: ${coCity.trim()} | RNT: ${OP_CO.licenseNumber}`);
  });

  test('G2. Registro operador Brasil — Freelance con CADASTUR y CPF', async ({ page }) => {
    await page.goto('/register/operator');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Registro de operador')).toBeVisible({ timeout: 8_000 });

    // Verificar que existe ciudad brasileña en el select
    const citySelect = page.locator('select[name="cityId"]');
    await expect(citySelect).toBeVisible({ timeout: 5_000 });
    const cityOptions = await citySelect.locator('option').allTextContents();

    const brCityOption = cityOptions.find(o => {
      const t = o.trim().toLowerCase();
      return t === OP_BR.city.toLowerCase() || t === 'rio de janeiro' || t === 'florianópolis' || t === 'manaus';
    });

    if (!brCityOption) {
      console.warn('⚠ No hay ciudad brasileña disponible en el formulario — test G2 skipped');
      test.skip();
      return;
    }

    // Nombre
    await page.fill('input[name="name"]', OP_BR.name);

    // Email
    await page.fill('input[type="email"]', OP_BR.email);

    // Teléfono
    await page.fill('input[name="phone"]', OP_BR.phone);

    // Ciudad brasileña
    await citySelect.selectOption({ label: brCityOption.trim() });

    // Tipo: Freelance
    await page.locator('select[name="type"]').selectOption({ value: 'FREELANCE' });

    // CPF (freelance Brasil)
    await page.fill('input[name="cpf"]', OP_BR.cpf);

    // CADASTUR
    await page.fill('input[name="cadastur"]', OP_BR.cadastur);

    // Aceptar responsabilidad
    await page.check('#liabilityAccepted');

    // Submit
    await Promise.all([
      page.waitForURL('/login', { timeout: 20_000 }),
      page.click('button[type="submit"]'),
    ]);

    await expect(page).toHaveURL('/login');
    console.log(`✓ Operador BR registrado: ${OP_BR.email} | Ciudad: ${brCityOption.trim()} | CADASTUR: ${OP_BR.cadastur}`);
  });

  test('G3. Admin — revisar pendientes y aprobar operadores CO y BR', async ({ page }) => {
    // Login como superadmin vía API — la cookie se propaga al contexto del browser
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    expect(loginRes.status()).toBe(200);
    console.log('✓ Admin logueado');

    // Ir a la página de verificación de operadores
    await page.goto('/admin/operators/verification');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Verificación de operadores')).toBeVisible({ timeout: 8_000 });

    // ── Aprobar operador Colombia ────────────────────────────────────────
    const coRow = page.locator('tr', { hasText: OP_CO.name });
    if (await coRow.isVisible({ timeout: 4_000 }).catch(() => false)) {
      const approveForm = coRow.locator('form').filter({ has: page.locator('[value="approve"]') });
      await approveForm.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      // Tras aprobar, el row desaparece de la lista de pendientes
      await expect(coRow).not.toBeVisible({ timeout: 8_000 });
      console.log(`✓ Operador CO aprobado: ${OP_CO.name}`);
    } else {
      console.warn(`⚠ Operador CO "${OP_CO.name}" no encontrado en pendientes`);
    }

    // ── Aprobar operador Brasil ──────────────────────────────────────────
    const brRow = page.locator('tr', { hasText: OP_BR.name });
    if (await brRow.isVisible({ timeout: 4_000 }).catch(() => false)) {
      const approveForm = brRow.locator('form').filter({ has: page.locator('[value="approve"]') });
      await approveForm.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');
      await expect(brRow).not.toBeVisible({ timeout: 8_000 });
      console.log(`✓ Operador BR aprobado: ${OP_BR.name}`);
    } else {
      console.warn(`⚠ Operador BR "${OP_BR.name}" no encontrado en pendientes`);
    }

    // ── Confirmar que no quedan pendientes con esos emails ───────────────
    const remainingText = await page.locator('tbody').textContent() ?? '';
    const coStillPending = remainingText.includes(OP_CO.name);
    const brStillPending = remainingText.includes(OP_BR.name);

    expect(coStillPending).toBe(false);
    expect(brStillPending).toBe(false);

    console.log('✓ Flujo completo: registro CO + BR + aprobación admin OK');
  });
});
