import prisma from '@/lib/db';
import { requireAuth } from '@/lib/requireRole';
import { redirect } from 'next/navigation';
import { formatPrice } from '@/domain/entities/Money';

export default async function ExperiencesPage() {
  const auth = await requireAuth();

  const include = {
    operator: true,
    city: true,
    category: true,
    country: { select: { defaultCurrency: { select: { code: true } } } },
  } as const;

  const experiences =
    auth.role === 'SUPERADMIN'
      ? await prisma.experience.findMany({
          include,
          orderBy: { id: 'desc' },
        })
      : await prisma.experience.findMany({
          where: { operator: { userId: auth.userId } },
          include,
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
    <div>
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Experiencias</h1>
          <p className="mt-1 text-sm text-slate-500">
            {auth.role === 'SUPERADMIN' ? 'Todas las experiencias publicadas en NativaGo.' : 'Tus experiencias publicadas en NativaGo.'}
          </p>
        </div>
        <a
          href={auth.role === 'SUPERADMIN' ? '/admin/new' : '/admin/experiences/new'}
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          Nueva experiencia
        </a>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Imagen</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Título</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ciudad</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Precio</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Operador</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {experiences.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2">
                    {Array.isArray(exp.images) && exp.images?.[0] ? (
                      <img
                        src={exp.images?.[0]}
                        alt={exp.title}
                        className="h-12 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-lg bg-slate-100" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{exp.title}</td>
                  <td className="px-4 py-2.5 text-slate-600">{exp.city?.name}</td>
                  <td className="px-4 py-2.5 text-right text-slate-900">
                    {formatPrice(Number(exp.price), exp.country?.defaultCurrency.code ?? 'COP')}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{exp.operator?.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-3">
                      <a
                        href={`/admin/experiences/${exp.id}/edit`}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        Editar
                      </a>
                      <a
                        href={`/admin/experiences/${exp.id}/availability`}
                        className="text-xs font-medium text-sky-700 hover:underline"
                      >
                        Disponibilidad
                      </a>
                      <form action={deleteExp} className="inline">
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
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No hay experiencias creadas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
