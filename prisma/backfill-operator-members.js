/* eslint-disable @typescript-eslint/no-require-imports */
// Crea la fila OperatorMember(role: ADMIN) para cada Operator.userId existente.
// Desde que existe OperatorMember, es la única fuente de verdad para permisos
// (Operator.userId queda solo como referencia de quién se auto-registró).
// Idempotente: usa upsert sobre @@unique([operatorId, userId]), seguro de re-correr.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const operators = await prisma.operator.findMany({
    where: { userId: { not: null } },
    select: { id: true, userId: true },
  });

  let created = 0;
  for (const op of operators) {
    await prisma.operatorMember.upsert({
      where: { operatorId_userId: { operatorId: op.id, userId: op.userId } },
      update: {},
      create: { operatorId: op.id, userId: op.userId, role: 'ADMIN' },
    });
    created++;
  }

  console.log(`✔ Backfill completo: ${created} OperatorMember(ADMIN) verificados/creados de ${operators.length} operadores con userId.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
