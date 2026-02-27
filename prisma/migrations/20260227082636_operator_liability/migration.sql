-- AlterTable
ALTER TABLE "Operator" ADD COLUMN     "liabilityAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "liabilityAcceptedAt" TIMESTAMP(3);
