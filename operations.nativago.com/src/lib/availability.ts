import { db } from '@/lib/db';

export async function getRemainingCapacity(slotId: number): Promise<number> {
  // Obtener slot
  const slot = await db.slot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error('Slot not found');

  // Sumar asientos reservados en bookings confirmados
  const bookings = await db.booking.findMany({
    where: {
      slotId,
      status: 'CONFIRMED',
    },
    select: { seats: true },
  });
  const reserved = bookings.reduce((sum, b) => sum + b.seats, 0);

  // Calcular capacidad restante
  return slot.capacity - reserved;
}
