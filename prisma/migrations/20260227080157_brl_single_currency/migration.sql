/*
  Warnings:

  - You are about to drop the column `currency` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `priceUSD` on the `Experience` table. All the data in the column will be lost.
  - Made the column `amount` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `depositAmount` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `remainingAmount` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "depositAmount" SET NOT NULL,
ALTER COLUMN "remainingAmount" SET NOT NULL;

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "currency",
DROP COLUMN "priceUSD";

-- DropEnum
DROP TYPE "Currency";
