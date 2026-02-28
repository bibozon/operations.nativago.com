import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const bookingId = Number(params.id);
  if (!bookingId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body;

  // Obtener booking y experiencia
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { experience: true },
  });
  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  // Permisos: SUPERADMIN o operador dueño
  const isSuperAdmin = user.role === 'SUPERADMIN';
  const isOwner = booking.experience.operatorId === user.operatorId;
  if (!isSuperAdmin && !isOwner) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // Acción: cancelar o confirmar
  let newStatus = '';
  if (action === 'cancel') {
    newStatus = 'CANCELLED';
  } else {
    newStatus = 'CONFIRMED';
  }

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
  });
  return NextResponse.json(updated);
}
