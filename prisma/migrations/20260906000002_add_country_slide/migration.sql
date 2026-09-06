-- CreateEnum
CREATE TYPE "SlideType" AS ENUM ('HERO', 'PHOTO_SLIDER', 'DESTINATION');

-- CreateTable
CREATE TABLE "CountrySlide" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "type" "SlideType" NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "emoji" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountrySlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CountrySlide_countryId_type_idx" ON "CountrySlide"("countryId", "type");

-- AddForeignKey
ALTER TABLE "CountrySlide" ADD CONSTRAINT "CountrySlide_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
