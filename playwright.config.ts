/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const CMS_URL = process.env.PLAYWRIGHT_CMS_URL ?? 'http://localhost:3001';
const MKT_URL = process.env.PLAYWRIGHT_MKT_URL ?? 'http://localhost:3000';

export default defineConfig({
  globalSetup: './tests/e2e/globalSetup.ts',
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  timeout: 90_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Sin webServer: los servidores se arrancan manualmente antes de correr tests.
  // globalSetup hace el warmup + health-check con retry.
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'cms',
      use: { ...devices['Desktop Chrome'], baseURL: CMS_URL },
      testMatch: ['**/operador-*.spec.ts', '**/admin-crud.spec.ts'],
    },
    {
      name: 'marketplace',
      use: { ...devices['Desktop Chrome'], baseURL: MKT_URL },
      testMatch: ['**/guest-booking.spec.ts'],
    },
  ],
});
