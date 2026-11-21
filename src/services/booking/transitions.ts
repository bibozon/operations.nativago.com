// Único punto por el que cambia el estado de una reserva. Valida la transición,
// guarda el cambio + el historial (BookingEvent) + los avisos pendientes en una
// sola transacción, y luego intenta enviar los avisos sin bloquear al usuario.

import type { BookingStatus, Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { enqueueNotifications, flushForBooking, type OutboxItem } from '@/services/notifications/outbox';

export interface Actor {
  role: string; // SUPERADMIN | SUPPORT | OPERATOR_AGENCY | OPERATOR_FREELANCE | CUSTOMER | SYSTEM
  userId?: number | null;
}

// CANCELLED es terminal: reactivar una reserva saltaría el control de cupo.
const ALLOWED: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED[from].includes(to);
}

const OPERATOR_ROLES = new Set(['OPERATOR_AGENCY', 'OPERATOR_FREELANCE']);

export function notificationsForStatusChange(to: BookingStatus, actor: Actor): OutboxItem[] {
  if (to === 'CONFIRMED') return [{ event: 'BOOKING_CONFIRMED', recipientRole: 'GUEST' }];
  if (to === 'CANCELLED') {
    const items: OutboxItem[] = [{ event: 'BOOKING_CANCELLED', recipientRole: 'GUEST' }];
    // Si cancela el propio operador no hace falta avisarle a él mismo.
    if (!OPERATOR_ROLES.has(actor.role)) items.push({ event: 'BOOKING_CANCELLED', recipientRole: 'OPERATOR' });
    return items;
  }
  return [];
}

export type ChangeResult =
  | { ok: true; changed: boolean }
  | { ok: false; reason: 'not_found' | 'invalid_transition' };

export async function changeBookingStatus(params: {
  bookingId?: number;
  bookingCode?: string;
  to: BookingStatus;
  actor: Actor;
  reason?: string | null;
}): Promise<ChangeResult> {
  const { to, actor } = params;
  const reason = params.reason?.trim().slice(0, 300) || null;
  const ctx: { notifyId: number | null } = { notifyId: null };

  const outcome = await prisma.$transaction(async (tx): Promise<ChangeResult> => {
    const booking = await tx.booking.findUnique({
      where: params.bookingId !== undefined ? { id: params.bookingId } : { bookingCode: params.bookingCode ?? '' },
      select: { id: true, bookingCode: true, status: true },
    });
    if (!booking) return { ok: false, reason: 'not_found' };
    if (booking.status === to) return { ok: true, changed: false };
    if (!canTransition(booking.status, to)) return { ok: false, reason: 'invalid_transition' };

    await tx.booking.update({
      where: { id: booking.id },
      data: { status: to, ...(to === 'CANCELLED' ? { cancelReason: reason } : {}) },
    });
    await tx.bookingEvent.create({
      data: {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        type: 'STATUS_CHANGED',
        fromStatus: booking.status,
        toStatus: to,
        actorRole: actor.role,
        actorUserId: actor.userId ?? null,
        reason,
      },
    });
    await enqueueNotifications(tx, booking.id, notificationsForStatusChange(to, actor));
    ctx.notifyId = booking.id;
    return { ok: true, changed: true };
  });

  if (ctx.notifyId !== null) await flushForBooking(ctx.notifyId);
  return outcome;
}

// Check-in por QR: registra la asistencia real (checkedInAt) y deja la reserva
// CONFIRMED. Es idempotente: un segundo escaneo no duplica historial ni avisos.
export async function recordCheckIn(params: {
  bookingCode: string;
  actor: Actor;
}): Promise<{ ok: true; alreadyCheckedIn: boolean } | { ok: false; reason: 'not_found' | 'cancelled' }> {
  const ctx: { notifyId: number | null } = { notifyId: null };

  const outcome = await prisma.$transaction(
    async (tx: Prisma.TransactionClient): Promise<{ ok: true; alreadyCheckedIn: boolean } | { ok: false; reason: 'not_found' | 'cancelled' }> => {
      const booking = await tx.booking.findUnique({
        where: { bookingCode: params.bookingCode },
        select: { id: true, bookingCode: true, status: true, checkedInAt: true },
      });
      if (!booking) return { ok: false, reason: 'not_found' };
      if (booking.status === 'CANCELLED') return { ok: false, reason: 'cancelled' };
      if (booking.checkedInAt) return { ok: true, alreadyCheckedIn: true };

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED', checkedInAt: new Date() },
      });
      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          type: 'CHECKED_IN',
          fromStatus: booking.status,
          toStatus: 'CONFIRMED',
          actorRole: params.actor.role,
          actorUserId: params.actor.userId ?? null,
        },
      });
      await enqueueNotifications(tx, booking.id, [{ event: 'REVIEW_REQUEST', recipientRole: 'GUEST' }]);
      ctx.notifyId = booking.id;
      return { ok: true, alreadyCheckedIn: false };
    },
  );

  if (ctx.notifyId !== null) await flushForBooking(ctx.notifyId);
  return outcome;
}
