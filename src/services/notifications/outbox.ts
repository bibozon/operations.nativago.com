// Cola de avisos (outbox): cada cambio importante de una reserva escribe filas
// PENDING en la MISMA transacción que el cambio; un procesador las envía con
// reintentos. Si el proveedor de correo falla o no está configurado, el aviso no
// se pierde ni rompe la reserva: queda en cola hasta que se pueda enviar.

import type { Prisma, PrismaClient } from '@prisma/client';
import prisma from '@/lib/db';
import { sendEmail, isEmailConfigured } from '@/lib/mailer';
import {
  langForCountry,
  guestBookingReceived,
  operatorNewBooking,
  guestBookingConfirmed,
  guestBookingCancelled,
  operatorBookingCancelled,
  guestReviewRequest,
  type BookingMailData,
  type RenderedMail,
} from './emailTemplates';

export type OutboxEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'REVIEW_REQUEST';
export type OutboxRecipient = 'GUEST' | 'OPERATOR';

export interface OutboxItem {
  event: OutboxEvent;
  recipientRole: OutboxRecipient;
}

const MAX_ATTEMPTS = 5;
const LEASE_MS = 2 * 60_000; // tiempo que una fila queda "tomada" mientras se envía
const EXPIRE_AFTER_MS = 48 * 60 * 60_000; // un aviso de más de 48 h ya no sirve

type Db = Prisma.TransactionClient | PrismaClient;

export function dedupeKeyFor(bookingId: number, item: OutboxItem, channel = 'EMAIL'): string {
  return `${bookingId}:${item.event}:${item.recipientRole}:${channel}`;
}

// Segundos de espera antes del siguiente intento: 2, 4, 8, 16 min.
export function backoffMs(attempts: number): number {
  return Math.min(2 ** attempts, 16) * 60_000;
}

// Escribe los avisos. Usar dentro de la misma transacción que cambia la reserva.
export async function enqueueNotifications(db: Db, bookingId: number, items: OutboxItem[]): Promise<void> {
  if (items.length === 0) return;
  await db.notificationOutbox.createMany({
    data: items.map((item) => ({
      bookingId,
      event: item.event,
      recipientRole: item.recipientRole,
      channel: 'EMAIL' as const,
      dedupeKey: dedupeKeyFor(bookingId, item),
    })),
    skipDuplicates: true,
  });
}

function requireBaseUrl(): string {
  const base = (process.env.MVP_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('MVP_PUBLIC_URL no configurada — no se puede armar el enlace del correo');
  return base;
}

async function loadMailData(bookingId: number): Promise<BookingMailData | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      experience: {
        select: {
          title: true,
          meetingPoint: true,
          operator: { select: { name: true, email: true } },
          country: { select: { code: true, timezone: { select: { ianaName: true } } } },
        },
      },
    },
  });
  if (!booking || !booking.bookingCode) return null;

  const base = requireBaseUrl();
  return {
    bookingCode: booking.bookingCode,
    experienceTitle: booking.experience.title,
    guestName: booking.customerName,
    guestEmail: booking.customerEmail,
    guests: booking.guests,
    date: booking.date,
    timeZone: booking.experience.country?.timezone.ianaName ?? 'America/Sao_Paulo',
    operatorName: booking.experience.operator.name,
    operatorEmail: booking.experience.operator.email,
    meetingPoint: booking.experience.meetingPoint,
    reason: booking.cancelReason,
    voucherUrl: `${base}/mis-reservas/${encodeURIComponent(booking.bookingCode)}`,
    panelUrl: `${base}/cms/admin/bookings`,
    lang: langForCountry(booking.experience.country?.code),
  };
}

function render(event: string, recipient: string, data: BookingMailData): RenderedMail {
  const key = `${event}:${recipient}`;
  switch (key) {
    case 'BOOKING_CREATED:GUEST':
      return guestBookingReceived(data);
    case 'BOOKING_CREATED:OPERATOR':
      return operatorNewBooking(data);
    case 'BOOKING_CONFIRMED:GUEST':
      return guestBookingConfirmed(data);
    case 'BOOKING_CANCELLED:GUEST':
      return guestBookingCancelled(data);
    case 'BOOKING_CANCELLED:OPERATOR':
      return operatorBookingCancelled(data);
    case 'REVIEW_REQUEST:GUEST':
      return guestReviewRequest({ ...data, reviewUrl: `${requireBaseUrl()}/calificar/${encodeURIComponent(data.bookingCode)}` });
    default:
      throw new Error(`Aviso no soportado: ${key}`);
  }
}

export interface ProcessResult {
  sent: number;
  retried: number;
  failed: number;
  expired: number;
  skipped: 'email_not_configured' | null;
}

// Procesa avisos vencidos. `bookingId` limita el trabajo a una reserva (envío
// inmediato best-effort tras el cambio); sin él, procesa la cola completa (cron).
export async function processOutbox(opts: { limit?: number; bookingId?: number } = {}): Promise<ProcessResult> {
  const result: ProcessResult = { sent: 0, retried: 0, failed: 0, expired: 0, skipped: null };

  // Sin proveedor de correo los avisos esperan en cola (no se marcan enviados).
  if (!isEmailConfigured()) {
    console.warn('[outbox] RESEND_API_KEY no configurada — los avisos quedan en cola');
    result.skipped = 'email_not_configured';
    return result;
  }

  const now = new Date();
  const candidates = await prisma.notificationOutbox.findMany({
    where: {
      status: 'PENDING',
      nextAttemptAt: { lte: now },
      ...(opts.bookingId !== undefined ? { bookingId: opts.bookingId } : {}),
    },
    orderBy: { id: 'asc' },
    take: opts.limit ?? 25,
  });

  for (const row of candidates) {
    if (now.getTime() - row.createdAt.getTime() > EXPIRE_AFTER_MS) {
      await prisma.notificationOutbox.update({
        where: { id: row.id },
        data: { status: 'EXPIRED', lastError: 'Aviso vencido (más de 48 h en cola)' },
      });
      result.expired++;
      continue;
    }

    // Toma la fila: si otra ejecución ya la tomó, count === 0 y se omite.
    const claimed = await prisma.notificationOutbox.updateMany({
      where: { id: row.id, status: 'PENDING', nextAttemptAt: { lte: now } },
      data: { nextAttemptAt: new Date(now.getTime() + LEASE_MS), attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue;
    const attempt = row.attempts + 1;

    try {
      if (row.channel !== 'EMAIL') throw new Error(`Canal no implementado: ${row.channel}`);

      const data = await loadMailData(row.bookingId);
      if (!data) {
        await prisma.notificationOutbox.update({
          where: { id: row.id },
          data: { status: 'EXPIRED', lastError: 'La reserva ya no existe' },
        });
        result.expired++;
        continue;
      }

      const mail = render(row.event, row.recipientRole, data);
      await sendEmail({
        from: process.env.EMAIL_FROM ?? 'NativaGo <noreply@nativago.com>',
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
      });
      await prisma.notificationOutbox.update({
        where: { id: row.id },
        data: { status: 'SENT', sentAt: new Date(), lastError: null },
      });
      result.sent++;
    } catch (error) {
      const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
      if (attempt >= MAX_ATTEMPTS) {
        await prisma.notificationOutbox.update({
          where: { id: row.id },
          data: { status: 'FAILED', lastError: message },
        });
        result.failed++;
      } else {
        await prisma.notificationOutbox.update({
          where: { id: row.id },
          data: { nextAttemptAt: new Date(Date.now() + backoffMs(attempt)), lastError: message },
        });
        result.retried++;
      }
      console.error(`[outbox] aviso ${row.id} (${row.event}/${row.recipientRole}) falló, intento ${attempt}:`, message);
    }
  }

  return result;
}

// Envío inmediato best-effort tras un cambio: nunca lanza ni retrasa más de
// `timeoutMs`; lo que no alcance a salir lo recoge el cron.
export async function flushForBooking(bookingId: number, timeoutMs = 4000): Promise<void> {
  try {
    await Promise.race([
      processOutbox({ bookingId, limit: 10 }),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch (error) {
    console.error('[outbox] flushForBooking falló (lo recogerá el cron):', error);
  }
}
