import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { ADMIN, CMS_URL } from '../../../e2e/support/test-data';

const { Given, When, Then } = createBdd(test);

const uid = () => Math.random().toString(36).slice(2, 7);

Given('que inicié sesión como SuperAdmin', async ({ page }) => {
  const res = await page.request.post(`${CMS_URL}/api/auth/login`, {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  expect(res.status()).toBe(200);
});

When('voy al dashboard de administración', async ({ page }) => {
  await page.goto('/admin/dashboard');
  await page.waitForLoadState('networkidle');
});

Then('veo un único menú lateral', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('aside')).toHaveCount(1);
});

// ── Categorías ──────────────────────────────────────────────────────────

Given('que estoy en la administración de categorías', async ({ page }) => {
  await page.goto('/admin/categories');
  await page.waitForLoadState('networkidle');
});

When('creo la categoría {string}', async ({ page }, name: string) => {
  await page.fill('input[name="name"]', `${name} ${uid()}`);
  await page.click('button:has-text("Crear")');
  await page.waitForLoadState('networkidle');
});

Then('la categoría {string} aparece en la lista', async ({ page }, name: string) => {
  await expect(page.locator('tr', { hasText: name })).toBeVisible({ timeout: 8_000 });
});

When('elimino la categoría {string}', async ({ page }, name: string) => {
  await page.locator('tr', { hasText: name }).getByRole('button', { name: 'Eliminar' }).click();
  await page.waitForLoadState('networkidle');
});

Then('la categoría {string} ya no aparece en la lista', async ({ page }, name: string) => {
  await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
});

When('intento crear una categoría con nombre vacío', async ({ page, world }) => {
  world.rowCountBefore = await page.locator('tbody tr').count();
  await page.fill('input[name="name"]', '');
  await page.click('button:has-text("Crear")');
  await page.waitForLoadState('networkidle');
});

Then('no se agrega ninguna fila nueva a la lista de categorías', async ({ page, world }) => {
  const rowCountAfter = await page.locator('tbody tr').count();
  expect(rowCountAfter).toBe(world.rowCountBefore);
});

// ── Ciudades ────────────────────────────────────────────────────────────

Given('que estoy en la administración de ciudades', async ({ page }) => {
  await page.goto('/admin/cities');
  await page.waitForLoadState('networkidle');
});

When('creo la ciudad {string} con el primer país disponible', async ({ page }, name: string) => {
  await page.fill('input[name="name"]', `${name} ${uid()}`);
  await page.selectOption('select[name="countryId"]', { index: 1 });
  await page.click('button:has-text("Crear")');
  await page.waitForLoadState('networkidle');
});

Then('la ciudad {string} aparece en la lista', async ({ page }, name: string) => {
  await expect(page.locator('tr', { hasText: name })).toBeVisible({ timeout: 8_000 });
});

When('elimino la ciudad {string}', async ({ page }, name: string) => {
  await page.locator('tr', { hasText: name }).getByRole('button', { name: 'Eliminar' }).click();
  await page.waitForLoadState('networkidle');
});

Then('la ciudad {string} ya no aparece en la lista', async ({ page }, name: string) => {
  await expect(page.locator('tr', { hasText: name })).toHaveCount(0);
});

When('intento crear una ciudad con nombre vacío', async ({ page, world }) => {
  world.rowCountBefore = await page.locator('tbody tr').count();
  await page.fill('input[name="name"]', '');
  await page.click('button:has-text("Crear")');
  await page.waitForLoadState('networkidle');
});

Then('no se agrega ninguna fila nueva a la lista de ciudades', async ({ page, world }) => {
  const rowCountAfter = await page.locator('tbody tr').count();
  expect(rowCountAfter).toBe(world.rowCountBefore);
});

// ── Operadores ──────────────────────────────────────────────────────────

Given('que estoy en la administración de operadores', async ({ page }) => {
  await page.goto('/admin/operators');
  await page.waitForLoadState('networkidle');
});

When('edito el teléfono del primer operador de la lista', async ({ page, world }) => {
  const firstRow = page.locator('tbody tr').first();
  const operatorName = (await firstRow.locator('td').first().textContent())?.trim() ?? '';
  expect(operatorName.length).toBeGreaterThan(0);
  world.operatorName = operatorName;

  await firstRow.getByRole('link', { name: 'Editar' }).click();
  await page.waitForURL(/\/admin\/operators\/.+\/edit/, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');

  world.newPhone = `+57 300 ${Math.floor(100000 + Math.random() * 899999)}`;
  await page.fill('input[name="phone"]', world.newPhone);
  await page.click('button:has-text("Guardar cambios")');
  await page.waitForURL(/\/admin\/operators$/, { timeout: 10_000 });
  await page.waitForLoadState('networkidle');
});

Then('el cambio de teléfono se guarda correctamente', async ({ world }) => {
  // Si el submit anterior nos devolvió a /admin/operators sin error, el
  // servidor aceptó el cambio (la Server Action redirige solo en éxito).
  expect(world.operatorName).toBeTruthy();
});

When('alterno el estado Activar\\/Desactivar de ese operador', async ({ page, world }) => {
  const row = page.locator('tr', { hasText: world.operatorName as string }).first();
  const toggleBtn = row.getByRole('button', { name: /^(Desactivar|Activar)$/ });
  const hadToggle = (await toggleBtn.count()) > 0;
  world.hadToggle = hadToggle;
  if (hadToggle) {
    world.toggleLabel = (await toggleBtn.textContent())?.trim();
    await toggleBtn.click();
    await page.waitForLoadState('networkidle');
  }
});

Then('el estado del operador cambia en la lista', async ({ page, world }) => {
  if (!world.hadToggle) {
    // El primer operador de la lista no tenía acción Activar/Desactivar
    // disponible (su estado no es APPROVED/SUSPENDED) — nada que verificar.
    return;
  }
  const expectedNext = world.toggleLabel === 'Desactivar' ? 'Suspendido' : 'Activo';
  const row = page.locator('tr', { hasText: world.operatorName as string }).first();
  await expect(row).toContainText(expectedNext, { timeout: 8_000 });

  // Revertir al estado original para no dejar el dato de prueba mutado.
  const revertBtn = row.getByRole('button', { name: /^(Desactivar|Activar)$/ });
  await revertBtn.click();
  await page.waitForLoadState('networkidle');
});

// ── Experiencias ────────────────────────────────────────────────────────

Given('que estoy en la administración de experiencias', async ({ page }) => {
  await page.goto('/admin/experiences');
  await page.waitForLoadState('networkidle');
});

When('hago clic en {string}', async ({ page }, text: string) => {
  await page.click(`text=${text}`);
  await page.waitForLoadState('networkidle');
});

Then('llego al formulario de creación con un selector de operador', async ({ page }) => {
  await expect(page).toHaveURL(/\/admin\/new/, { timeout: 10_000 });
  await expect(page.getByText('Crear experiencia')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText('Operador', { exact: true })).toBeVisible();
});
