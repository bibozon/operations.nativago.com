import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';

export default async function BookingsPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const auth = await requireAuth();
  const staffOrAbove = isStaffOrAbove(auth.role);
  const isSuperadmin = auth.role === 'SUPERADMIN';

  const bookings = staffOrAbove
    ? await prisma.booking.findMany({
        include: { experience: { include: { operator: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : await prisma.booking.findMany({
        where: { experience: { operatorId: auth.operatorId ?? '' } },
        include: { experience: true },
        orderBy: { createdAt: 'desc' },
      });

  async function updateStatus(formData: FormData) {
    'use server';

    const authInAction = await requireAuth();

    const idRaw = formData.get('id');
    const status = formData.get('status');

    const id = typeof idRaw === 'string' ? Number(idRaw) : NaN;
    const statusStr = typeof status === 'string' ? status : '';

    if (!Number.isFinite(id) || !statusStr) return;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { experience: { select: { operatorId: true } } },
    });

    if (!booking) return;

    if (
      !isStaffOrAbove(authInAction.role) &&
      booking.experience.operatorId !== authInAction.operatorId
    ) {
      return;
    }

    await prisma.booking.update({
      where: { id },
      data: { status: statusStr as any },
    });
  }

  async function deleteBooking(formData: FormData) {
    'use server';

    // A diferencia de confirmar/cancelar (staff u operador dueño), borrar
    // una reserva es irreversible y no deja rastro — se restringe a
    // SUPERADMIN, no a "staff" en general.
    const authInAction = await requireAuth();
    if (authInAction.role !== 'SUPERADMIN') return;

    const idRaw = formData.get('id');
    const id = typeof idRaw === 'string' ? Number(idRaw) : NaN;
    if (!Number.isFinite(id)) return;

    try {
      await prisma.booking.delete({ where: { id } });
    } catch {
      redirect('/admin/bookings?error=delete-failed');
    }

    redirect('/admin/bookings');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Reservas</h1>

      {searchParams?.error === 'delete-failed' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No se pudo eliminar la reserva. Intenta de nuevo.
        </div>
      )}

      <table className="w-full border text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="border px-2 py-1 text-left">Experiencia</th>
            <th className="border px-2 py-1 text-left">Operador</th>
            <th className="border px-2 py-1 text-left">Fecha</th>
            <th className="border px-2 py-1 text-left">Cliente</th>
            <th className="border px-2 py-1 text-right">Personas</th>
            <th className="border px-2 py-1 text-left">Estado</th>
            <th className="border px-2 py-1 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t">
              <td className="border px-2 py-1">{b.experience.title}</td>
              <td className="border px-2 py-1">
                {'operator' in b.experience
                  ? (b.experience as any).operator?.name
                  : ''}
              </td>
              <td className="border px-2 py-1">
                {new Date(b.date).toLocaleDateString('es-CO')}
              </td>
              <td className="border px-2 py-1">{b.customerName}</td>
              <td className="border px-2 py-1 text-right">{b.guests}</td>
              <td className="border px-2 py-1">{b.status}</td>
              <td className="border px-2 py-1 text-center">
                <form action={updateStatus} className="inline-flex gap-2">
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    name="status"
                    value="CONFIRMED"
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Confirmar
                  </button>
                  {isSuperadmin && b.status === 'CONFIRMED' && (
                    <button
                      type="submit"
                      name="status"
                      value="PENDING"
                      className="text-xs font-medium text-amber-700 hover:underline"
                    >
                      Desaprobar
                    </button>
                  )}
                  <button
                    type="submit"
                    name="status"
                    value="CANCELLED"
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Cancelar
                  </button>
                </form>
                {isSuperadmin && (
                  <form action={deleteBooking} className="ml-2 inline">
                    <input type="hidden" name="id" value={b.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-800 hover:underline"
                    >
                      Eliminar
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-3 py-4 text-center text-sm text-slate-500"
              >
                No hay reservas registradas todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
