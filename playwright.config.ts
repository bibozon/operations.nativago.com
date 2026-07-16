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
  webServer: [
    {
      command: 'npx next dev -p 3001',
      url: `${CMS_URL}/api/debug/db`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npx next dev -p 3000',
      url: MKT_URL,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: '../Proyecto_mpv_ngo_v1/nativago-mvp',
    },
  ],
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
      testMatch: ['**/operador-*.spec.ts'],
    },
    {
      name: 'marketplace',
      use: { ...devices['Desktop Chrome'], baseURL: MKT_URL },
      testMatch: ['**/guest-booking.spec.ts'],
    },
  ],
});
