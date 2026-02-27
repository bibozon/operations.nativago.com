/*
  Warnings:

  - You are about to alter the column `price` on the `Experience` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'BRL', 'COP');

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "priceUSD" DOUBLE PRECISION,
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;
