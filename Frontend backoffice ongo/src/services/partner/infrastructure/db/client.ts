import { PrismaClient } from "../../../../services/partner/infrastructure/db/generated";

const globalForPartner = globalThis as unknown as { partnerPrisma?: PrismaClient };

export const partnerPrisma =
  globalForPartner.partnerPrisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPartner.partnerPrisma = partnerPrisma;
}
