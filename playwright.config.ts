/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const CMS_URL = process.env.PLAYWRIGHT_CMS_URL ?? 'http://localhost:3001';
const MKT_URL = process.env.PLAYWRIGHT_MKT_URL ?? 'http://localhost:3000';

// Suite BDD (Gherkin/Cucumber) — un testDir generado por proyecto, para que
// cada uno resuelva su propio baseURL (CMS vs Marketplace) igual que antes.
const cmsBddDir = defineBddConfig({
  outputDir: '.bdd-gen/cms',
  features: 'tests/bdd/features/cms/**/*.feature',
  steps: ['tests/bdd/fixtures.ts', 'tests/bdd/steps/cms/**/*.steps.ts'],
});

const marketplaceBddDir = defineBddConfig({
  outputDir: '.bdd-gen/marketplace',
  features: 'tests/bdd/features/marketplace/**/*.feature',
  steps: ['tests/bdd/fixtures.ts', 'tests/bdd/steps/marketplace/**/*.steps.ts'],
});

export default defineConfig({
  globalSetup: './tests/e2e/globalSetup.ts',
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
      testDir: cmsBddDir,
      use: { ...devices['Desktop Chrome'], baseURL: CMS_URL },
    },
    {
      name: 'marketplace',
      testDir: marketplaceBddDir,
      use: { ...devices['Desktop Chrome'], baseURL: MKT_URL },
    },
  ],
});
