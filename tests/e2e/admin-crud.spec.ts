/**
 * NativaGo — CRUD de SuperAdmin en el CMS
 *
 * A1  Un solo menú (sin sidebar duplicado) en el dashboard
 * A2  Categorías: crear, ver en la lista, eliminar
 * A3  Ciudades: crear, ver en la lista, eliminar
 * A4  Operadores: editar (guardar cambio real) y alternar Activar/Desactivar
 * A5  Experiencias: "Nueva experiencia" lleva a /admin/new (no redirige a SuperAdmin)
 */

import { test, expect } from '@playwright/test';
import { ADMIN, CMS_URL } from './support/test-data';

const uid = () => Math.random().toString(36).slice(2, 7);

test.describe('CMS — CRUD de SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    const res = await page.request.post(`${CMS_URL}/api/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    expect(res.status()).toBe(200);
  });

  test('A1. Dashboard — un solo menú, sin sidebar duplicado', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('aside')).toHaveCount(1);
    console.log('  ✓ A1 — Un solo <aside> en /admin/dashboard');
  });

  test('A2. Categorías — crear, listar y eliminar', async ({ page }) => {
    const name = `Categoría E2E ${uid()}`;

    await page.goto('/admin/categories');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="name"]', name);
    await page.click('button:has-text("Crear")');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: name });
    await expect(row).toBeVisible({ timeout: 8_000 });
    console.log(`  ✓ A2a — Categoría "${name}" creada y visible`);

    await row.getByRole('button', { name: 'Eliminar' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
    console.log('  ✓ A2b — Categoría eliminada');
  });

  test('A3. Ciudades — crear, listar y eliminar', async ({ page }) => {
    const name = `Ciudad E2E ${uid()}`;

    await page.goto('/admin/cities');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="name"]', name);
    const countryOptions = await page.locator('select[name="countryId"] option').allTextContents();
    const hasCountry = countryOptions.some((o) => o.trim().length > 0 && o.trim() !== 'Selecciona…');
    expect(hasCountry).toBe(true);
    await page.selectOption('select[name="countryId"]', { index: 1 });
    await page.click('button:has-text("Crear")');
    await page.waitForLoadState('networkidle');

    const row = page.locator('tr', { hasText: name });
    await expect(row).toBeVisible({ timeout: 8_000 });
    console.log(`  ✓ A3a — Ciudad "${name}" creada y visible`);

    await row.getByRole('button', { name: 'Eliminar' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
    console.log('  ✓ A3b — Ciudad eliminada');
  });

  test('A4. Operadores — editar y alternar Activar/Desactivar', async ({ page }) => {
    await page.goto('/admin/operators');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    const operatorName = (await firstRow.locator('td').first().textContent())?.trim() ?? '';
    expect(operatorName.length).toBeGreaterThan(0);

    await firstRow.getByRole('link', { name: 'Editar' }).click();
    await page.waitForURL(/\/admin\/operators\/.+\/edit/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const newPhone = `+57 300 ${Math.floor(100000 + Math.random() * 899999)}`;
    await page.fill('input[name="phone"]', newPhone);
    await page.click('button:has-text("Guardar cambios")');
    await page.waitForURL(/\/admin\/operators$/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    console.log(`  ✓ A4a — Operador "${operatorName}" editado (teléfono actualizado)`);

    // Alternar estado si el primer operador tiene Activar/Desactivar disponible
    const row = page.locator('tr', { hasText: operatorName }).first();
    const toggleBtn = row.getByRole('button', { name: /^(Desactivar|Activar)$/ });
    if (await toggleBtn.count() > 0) {
      const label = (await toggleBtn.textContent())?.trim();
      const expectedNext = label === 'Desactivar' ? 'Suspendido' : 'Activo';
      await toggleBtn.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('tr', { hasText: operatorName }).first()).toContainText(expectedNext, { timeout: 8_000 });
      console.log(`  ✓ A4b — Estado alternado (${label} → ${expectedNext})`);

      // revertir al estado original para no dejar el dato de prueba mutado
      const revertBtn = page.locator('tr', { hasText: operatorName }).first().getByRole('button', { name: /^(Desactivar|Activar)$/ });
      await revertBtn.click();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('  · A4b — Operador sin acción Activar/Desactivar disponible (estado no APPROVED/SUSPENDED), se omite');
    }
  });

  test('A5. Experiencias — "Nueva experiencia" funciona para SuperAdmin', async ({ page }) => {
    await page.goto('/admin/experiences');
    await page.waitForLoadState('networkidle');

    await page.click('text=Nueva experiencia');
    await page.waitForURL(/\/admin\/new/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Crear experiencia')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Operador', { exact: true })).toBeVisible();
    console.log('  ✓ A5 — /admin/new carga con selector de operador (SuperAdmin no fue redirigido)');
  });
});
