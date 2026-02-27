import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient({
  log: ['error', 'warn'],
});
if (typeof window === 'undefined') {
  globalThis.prisma = prisma;
}

export default prisma;
