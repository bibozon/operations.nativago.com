import prisma from '@/lib/db';
import { requireAuth } from '@/lib/requireRole';
import { redirect } from 'next/navigation';

export default async function ExperiencesPage() {
  const auth = await requireAuth();

  const experiences =
    auth.role === 'SUPERADMIN'
      ? await prisma.experience.findMany({
          include: { operator: true, city: true, category: true },
          orderBy: { id: 'desc' },
        })
      : await prisma.experience.findMany({
          where: { operator: { userId: auth.userId } },
          include: { operator: true, city: true, category: true },
          orderBy: { id: 'desc' },
        });

  async function deleteExp(formData: FormData) {
    'use server';

    const idRaw = formData.get('id');
    const id = typeof idRaw === 'string' ? idRaw : '';
    if (!id) return;

    const authInAction = await requireAuth();

    const exp = await prisma.experience.findUnique({
      where: { id },
      include: { operator: true },
    });

    if (!exp) return;

    if (
      authInAction.role !== 'SUPERADMIN' &&
      exp.operator?.userId !== authInAction.userId
    ) {
      return;
    }

    await prisma.experience.delete({ where: { id } });

    redirect('/admin/experiences');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Experiencias</h1>
        <a
          href="/admin/experiences/new"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Nueva experiencia
        </a>
      </div>

      <table className="mt-4 w-full border text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="border px-2 py-1 text-left">Imagen</th>
            <th className="border px-2 py-1 text-left">Título</th>
            <th className="border px-2 py-1 text-left">Ciudad</th>
            <th className="border px-2 py-1 text-right">Precio</th>
            <th className="border px-2 py-1 text-left">Operador</th>
            <th className="border px-2 py-1 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {experiences.map((exp) => (
            <tr key={exp.id} className="border-t">
              <td className="border px-2 py-1">
                {exp.image && (
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="h-12 w-16 rounded object-cover"
                  />
                )}
              </td>
              <td className="border px-2 py-1">{exp.title}</td>
              <td className="border px-2 py-1">{exp.city?.name}</td>
              <td className="border px-2 py-1 text-right">
                {`$${Number(exp.price).toLocaleString('es-CO')}`}
              </td>
              <td className="border px-2 py-1">{exp.operator?.name}</td>
              <td className="border px-2 py-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={`/admin/experiences/${exp.id}/edit`}
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    Editar
                  </a>
                  <a
                    href={`/admin/experiences/${exp.id}/availability`}
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Disponibilidad
                  </a>
                  <form action={deleteExp}>
                    <input type="hidden" name="id" value={exp.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {experiences.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-3 py-4 text-center text-sm text-slate-500"
              >
                No hay experiencias creadas aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
