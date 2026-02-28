-- CreateEnum
CREATE TYPE "OperatorType" AS ENUM ('AGENCY', 'FREELANCE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Operator" ADD COLUMN     "licenseDocument" TEXT,
ADD COLUMN     "licenseNumber" TEXT,
ADD COLUMN     "type" "OperatorType" NOT NULL DEFAULT 'AGENCY',
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';
