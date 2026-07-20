-- CreateEnum
CREATE TYPE "OperatorRole" AS ENUM ('ADMIN', 'STAFF');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPPORT';

-- CreateTable
CREATE TABLE "OperatorMember" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "OperatorRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorMember_operatorId_userId_key" ON "OperatorMember"("operatorId", "userId");

-- AddForeignKey
ALTER TABLE "OperatorMember" ADD CONSTRAINT "OperatorMember_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorMember" ADD CONSTRAINT "OperatorMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
