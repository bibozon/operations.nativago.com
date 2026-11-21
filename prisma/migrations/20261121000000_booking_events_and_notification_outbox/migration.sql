-- Historial de cambios de reservas + cola de avisos (outbox) + checkedInAt.
-- Aditiva: no modifica ni borra datos existentes.

ALTER TABLE "Booking" ADD COLUMN "checkedInAt" TIMESTAMP(3);

CREATE TYPE "BookingEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'CHECKED_IN');
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'EXPIRED');

CREATE TABLE "BookingEvent" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "bookingCode" TEXT,
    "type" "BookingEventType" NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus",
    "actorRole" TEXT,
    "actorUserId" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingEvent_bookingId_createdAt_idx" ON "BookingEvent"("bookingId", "createdAt");

CREATE TABLE "NotificationOutbox" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "dedupeKey" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationOutbox_dedupeKey_key" ON "NotificationOutbox"("dedupeKey");
CREATE INDEX "NotificationOutbox_status_nextAttemptAt_idx" ON "NotificationOutbox"("status", "nextAttemptAt");
CREATE INDEX "NotificationOutbox_bookingId_idx" ON "NotificationOutbox"("bookingId");
