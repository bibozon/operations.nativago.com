'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';
import { sendBookingCancelledEmail } from '@/lib/mailer';

// Cancelación iniciada por el operador (no por el cliente) — mismo rol de
// "rechazar" que pedía la auditoría: hoy no existe un paso previo de
// aceptación explícita (una reserva ya pasó el chequeo de cupo al crearse,
// ver catalog/bookings/route.ts, y se confirma recién en el check-in por
// QR), así que la palanca real que tiene el operador es poder cancelar una
// reserva que no puede cumplir (clima, imprevisto operativo, etc.) — a
// diferencia de la cancelación del cliente en
// catalog/bookings/[code]/cancel, esta NO tiene el corte de 24h: el
// operador puede necesitar cancelar justo el día de la actividad.
export async function cancelOperatorBooking(formData: FormData): Promise<void> {
  const auth = await requireAuth();
  const bookingCode = (formData.get('bookingCode') as string | null) ?? '';
  const reason = ((formData.get('reason') as string | null) ?? '').trim().slice(0, 300) || null;

  if (!bookingCode) return;

  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: { experience: { select: { title: true, operatorId: true } } },
  });

  if (!booking) return;

  if (!isStaffOrAbove(auth.role) && booking.experience.operatorId !== auth.operatorId) {
    return; // no es su reserva — no-op silencioso, igual que addSlot/deleteSlot
  }

  if (booking.status === 'CANCELLED') return;

  await prisma.booking.update({
    where: { bookingCode },
    data: { status: 'CANCELLED', cancelReason: reason },
  });

  if (booking.customerEmail) {
    const selectedDateLabel = booking.date.toLocaleString('es-CO', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    });
    sendBookingCancelledEmail({
      guestEmail: booking.customerEmail,
      guestName: booking.customerName,
      experienceTitle: booking.experience.title,
      selectedDateLabel,
      reason,
    }).catch((err) => {
      console.error('[cancelOperatorBooking] no se pudo enviar correo de cancelación:', err);
    });
  }

  revalidatePath('/admin/agency');
  revalidatePath('/admin/freelance');
}
