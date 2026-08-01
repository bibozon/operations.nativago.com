import { test as base } from 'playwright-bdd';

/**
 * "World" mutable por escenario — permite compartir estado (datos generados,
 * contextos de browser adicionales, etc.) entre pasos Given/When/Then que son
 * funciones registradas por separado y no comparten closures entre sí.
 */
export type World = Record<string, any>;

export const test = base.extend<{ world: World }>({
  // eslint-disable-next-line no-empty-pattern
  world: async ({}, use) => {
    await use({});
  },
});
