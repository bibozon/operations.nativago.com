-- AlterEnum: VerificationStatus — nuevos estados del ciclo de vida del operador
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'INFO_NEEDED';
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- CreateEnum: RiskLevel — nivel de riesgo de la experiencia
DO $$ BEGIN
    CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Operator — campos de registro ampliados
ALTER TABLE "Operator" ADD COLUMN IF NOT EXISTS "categoria"           TEXT;
ALTER TABLE "Operator" ADD COLUMN IF NOT EXISTS "legalRepresentative" TEXT;
ALTER TABLE "Operator" ADD COLUMN IF NOT EXISTS "paymentAccount"      TEXT;
ALTER TABLE "Operator" ADD COLUMN IF NOT EXISTS "reviewNotes"         TEXT;
ALTER TABLE "Operator" ALTER COLUMN "verificationStatus" SET DEFAULT 'DRAFT';

-- AlterTable: Experience — nivel de riesgo
ALTER TABLE "Experience" ADD COLUMN IF NOT EXISTS "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW';
