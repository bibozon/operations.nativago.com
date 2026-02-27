import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { communicationPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.communicationPrisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.communicationPrisma = prisma;
}
