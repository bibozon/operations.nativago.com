import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { CMS_URL } from '../../../e2e/support/test-data';

const { Given, When, Then } = createBdd(test);

Given('que estoy en la página de inicio de sesión del CMS', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
});

When('ingreso el email {string} y la contraseña {string}', async ({ page }, email: string, password: string) => {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
});

When('envío el formulario de inicio de sesión', async ({ page }) => {
  await page.locator('button[type="submit"]').click();
});

Then('soy redirigido al panel de administración', async ({ page }) => {
  await page.waitForURL(/\/admin/, { timeout: 10_000 });
});

Then('veo el mensaje de error {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible({ timeout: 6_000 });
});

Then('permanezco en la página de inicio de sesión', async ({ page }) => {
  await expect(page).toHaveURL(/\/login/);
});

When('envío una petición a la API de login sin email ni contraseña', async ({ page, world }) => {
  world.apiResponse = await page.request.post(`${CMS_URL}/api/auth/login`, { data: {} });
});

Then('la API responde con estado {int} y el mensaje {string}', async ({ world }, status: number, message: string) => {
  expect(world.apiResponse.status()).toBe(status);
  const body = await world.apiResponse.json();
  expect(body.error).toBe(message);
});
