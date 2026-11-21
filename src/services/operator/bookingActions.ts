'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';
import { changeBookingStatus } from '@/services/booking/transitions';

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

  // El servicio valida la transición, guarda el historial y encola el correo
  // de cancelación (con reintentos) en vez de enviarlo aquí "a ciegas".
  await changeBookingStatus({
    bookingCode,
    to: 'CANCELLED',
    actor: { role: auth.role, userId: auth.userId },
    reason,
  });

  revalidatePath('/admin/agency');
  revalidatePath('/admin/freelance');
}
