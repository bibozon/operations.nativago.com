-- Punto de encuentro para el voucher offline del cliente (PWA): texto libre
-- con direccion/indicaciones y una foto de referencia del lugar. Ambos
-- opcionales -- nulos en todas las experiencias existentes hasta que el
-- operador los complete desde /admin/experiences/[id]/edit.
ALTER TABLE "Experience" ADD COLUMN "meetingPoint" TEXT,
ADD COLUMN "meetingPointPhoto" TEXT;
