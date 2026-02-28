import prisma from '@/lib/db';
import { requireAuth } from '@/lib/requireRole';
import { redirect } from 'next/navigation';

interface AvailabilityPageProps {
  params: { id: string };
}

export default async function AvailabilityPage({ params }: AvailabilityPageProps) {
  const auth = await requireAuth();
  const expId = params.id;
  if (!expId || typeof expId !== 'string') {
    redirect('/admin/experiences');
  }

  const experience = await prisma.experience.findUnique({
    where: { id: expId },
    include: { operator: true },
  });

  if (!experience) {
    redirect('/admin/experiences');
  }

  if (auth.role !== 'SUPERADMIN' && experience.operator?.userId !== auth.userId) {
    redirect('/admin/experiences');
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: { experienceId: expId },
    orderBy: { date: 'asc' },
  });

  async function addSlot(formData: FormData) {
    'use server';

    const authInAction = await requireAuth();

    const currentExp = await prisma.experience.findUnique({
      where: { id: expId },
      include: { operator: true },
    });

    if (!currentExp) return;

    if (
      authInAction.role !== 'SUPERADMIN' &&
      currentExp.operator?.userId !== authInAction.userId
    ) {
      return;
    }

    const dateStr = formData.get('date') as string | null;
    const capacityRaw = formData.get('capacity') as string | null;
    if (!dateStr || !capacityRaw) return;
    const capacity = Number(capacityRaw);
    if (!Number.isFinite(capacity) || capacity <= 0) return;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const startTime = new Date(date);
    startTime.setHours(9, 0, 0, 0); // default 09:00 local
    await prisma.availabilitySlot.create({
      data: {
        experienceId: expId,
        date,
        startTime,
        capacity: capacity ?? 0,
      },
    });
  }

  async function deleteSlot(formData: FormData) {
    'use server';

    const authInAction = await requireAuth();

    const idRaw = formData.get('id') as string | null;
    const id = idRaw ?? '';
    if (!id) return;
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id },
      include: { experience: { include: { operator: true } } },
    });

    if (!slot) return;

    if (
      authInAction.role !== 'SUPERADMIN' &&
      slot.experience.operator?.userId !== authInAction.userId
    ) {
      return;
    }

    await prisma.availabilitySlot.delete({ where: { id } });
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Disponibilidad para "{experience.title}"</h1>

      <form action={addSlot} className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="date"
          name="date"
          className="rounded border px-2 py-2 text-sm"
        />
        <input
          type="number"
          name="capacity"
          min={1}
          placeholder="Cupos"
          className="w-32 rounded border px-2 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Agregar
        </button>
      </form>

      <table className="w-full border text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="border px-2 py-1 text-left">Fecha</th>
            <th className="border px-2 py-1 text-right">Cupos</th>
            <th className="border px-2 py-1 text-center" />
          </tr>
        </thead>
        <tbody>
          {slots.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="border px-2 py-1">
                {new Date(s.date).toLocaleDateString('es-CO')}
              </td>
              <td className="border px-2 py-1 text-right">{s.capacity}</td>
              <td className="border px-2 py-1 text-center">
                <form action={deleteSlot}>
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {slots.length === 0 && (
            <tr>
              <td
                colSpan={3}
                className="px-3 py-4 text-center text-sm text-slate-500"
              >
                Aún no has configurado disponibilidad para esta experiencia.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
