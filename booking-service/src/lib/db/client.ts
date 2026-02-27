import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { bookingPrisma?: PrismaClient };

export const prisma =
  globalForPrisma.bookingPrisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.bookingPrisma = prisma;
}
