/*
  Warnings:

  - A unique constraint covering the columns `[experienceId,date,startTime]` on the table `AvailabilitySlot` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AvailabilitySlot" ALTER COLUMN "capacity" SET DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_experienceId_date_startTime_key" ON "AvailabilitySlot"("experienceId", "date", "startTime");
