-- AddColumn: depositRate to Category
-- Default 0.15 (15%) for all categories.
-- Buceo is updated to 0.50 (50%) after the column is created.

ALTER TABLE "Category" ADD COLUMN "depositRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15;

-- Set buceo to 50% deposit due to pre-activity operational costs
UPDATE "Category" SET "depositRate" = 0.50 WHERE slug = 'buceo';
