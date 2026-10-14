-- Piloto Región de los Lagos: tracking de operadores fundadores (pioneros)
-- y reserva 100% gratis (sin anticipo vía pasarela) para todos los países.

-- 1) Operator: campos de tracking de pioneros / referidos
ALTER TABLE "Operator" ADD COLUMN "isPioneer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Operator" ADD COLUMN "firstActivatedBookingDate" TIMESTAMP(3);
ALTER TABLE "Operator" ADD COLUMN "referredByOperatorId" TEXT;

CREATE INDEX "Operator_referredByOperatorId_idx" ON "Operator"("referredByOperatorId");

ALTER TABLE "Operator" ADD CONSTRAINT "Operator_referredByOperatorId_fkey"
  FOREIGN KEY ("referredByOperatorId") REFERENCES "Operator"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Category: depósito en 0 para todos los países/categorías durante el
-- piloto (reserva gratis, 100% del valor se paga en persona al operador).
-- Incluye "buceo", que tenía 50% especial — también queda en 0 por decisión
-- explícita del negocio de desactivar el anticipo para TODOS los países.
ALTER TABLE "Category" ALTER COLUMN "depositRate" SET DEFAULT 0;
UPDATE "Category" SET "depositRate" = 0;

-- 3) Nuevos valores de enum para reservas sin anticipo
ALTER TYPE "PaymentStatus" ADD VALUE 'NOT_REQUIRED';
ALTER TYPE "PaymentType" ADD VALUE 'FREE';
