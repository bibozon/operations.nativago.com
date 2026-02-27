-- AlterTable
ALTER TABLE "Operator" ADD COLUMN     "contractAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contractAcceptedAt" TIMESTAMP(3);
