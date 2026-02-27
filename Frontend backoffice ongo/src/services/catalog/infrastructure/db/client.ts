import { PrismaClient } from "../../../../services/catalog/infrastructure/db/generated";

const globalForCatalog = globalThis as unknown as { catalogPrisma?: PrismaClient };

export const catalogPrisma =
  globalForCatalog.catalogPrisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForCatalog.catalogPrisma = catalogPrisma;
}
