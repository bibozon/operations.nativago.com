import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../../fixtures';
import { ADMIN, CMS_URL } from '../../../e2e/support/test-data';

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

Given('que tengo una cookie de sesión inválida', async ({ context }) => {
  await context.addCookies([
    { name: 'auth', value: 'token-invalido-no-firmado', domain: new URL(CMS_URL).hostname, path: '/' },
  ]);
});

When('intento entrar al dashboard de administración', async ({ page }) => {
  await page.goto('/admin/dashboard');
});

Then('soy redirigido a la página de inicio de sesión', async ({ page }) => {
  await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
});

When('envío {int} intentos de login consecutivos con la misma contraseña incorrecta', async ({ page, world }, attempts: number) => {
  world.bruteForceResponses = [];
  for (let i = 0; i < attempts; i++) {
    const res = await page.request.post(`${CMS_URL}/api/auth/login`, {
      data: { email: ADMIN.email, password: 'clave-incorrecta-bruteforce' },
    });
    world.bruteForceResponses.push(res.status());
  }
});

Then('alguno de los intentos responde con estado {int}', async ({ world }, status: number) => {
  expect(world.bruteForceResponses).toContain(status);
});
