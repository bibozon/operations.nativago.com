-- AlterTable
ALTER TABLE "Operator" ADD COLUMN     "cadastur" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "cpf" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "operatorTermsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "operatorTermsAcceptedAt" TIMESTAMP(3);
