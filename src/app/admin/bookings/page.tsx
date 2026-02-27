import prisma from '@/lib/db';
import { requireAuth } from '@/lib/requireRole';

export default async function BookingsPage() {
  const auth = await requireAuth();

  const bookings =
    auth.role === 'SUPERADMIN'
      ? await prisma.booking.findMany({
          include: { experience: { include: { operator: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : await prisma.booking.findMany({
          where: { experience: { operator: { userId: auth.userId } } },
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
      include: { experience: { include: { operator: true } } },
    });

    if (!booking) return;

    if (
      authInAction.role !== 'SUPERADMIN' &&
      booking.experience.operator?.userId !== authInAction.userId
    ) {
      return;
    }

    await prisma.booking.update({
      where: { id },
      data: { status: statusStr as any },
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Reservas</h1>

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
                  <button
                    type="submit"
                    name="status"
                    value="CANCELLED"
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Cancelar
                  </button>
                </form>
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
