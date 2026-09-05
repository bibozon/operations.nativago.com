import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';
import { deleteCityIfUnused } from '@/services/catalog/cities';

export default async function CitiesPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  await requireSuperadmin();

  const [cities, countries] = await Promise.all([
    prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: { countryRef: true, _count: { select: { experiences: true, operators: true } } },
    }),
    prisma.country.findMany({ orderBy: { name: 'asc' } }),
  ]);

  async function addCity(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const name = ((formData.get('name') as string) ?? '').trim();
    const countryId = (formData.get('countryId') as string) ?? '';
    if (!name || !countryId) return;

    const country = await prisma.country.findUnique({ where: { id: countryId } });
    if (!country) return;

    await prisma.city.create({
      data: { name, countryId, country: country.name },
    });

    revalidatePath('/admin/cities');
  }

  async function removeCity(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const id = (formData.get('id') as string) ?? '';
    if (!id) return;

    try {
      await deleteCityIfUnused(id);
    } catch {
      redirect('/admin/cities?error=in-use');
    }
    revalidatePath('/admin/cities');
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ciudades</h1>
        <p className="mt-1 text-sm text-slate-500">
          Destinos disponibles para operadores y experiencias, por país.
        </p>
      </header>

      <form action={addCity} className="mb-6 flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-slate-600">Nueva ciudad</label>
          <input
            name="name"
            placeholder="Ej. Medellín"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">País</label>
          <select name="countryId" className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100">
            <option value="">Selecciona…</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
        >
          Crear
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ciudad</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">País</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Experiencias / Operadores</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {cities.map((city) => {
                const inUse = city._count.experiences > 0 || city._count.operators > 0;
                return (
                  <tr key={city.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{city.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{city.countryRef?.name ?? city.country}</td>
                    <td className="px-4 py-2.5 text-center text-slate-900">
                      {city._count.experiences} / {city._count.operators}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {inUse ? (
                        <span className="text-xs text-slate-400" title="No se puede eliminar: en uso">
                          En uso
                        </span>
                      ) : (
                        <form action={removeCity} className="inline">
                          <input type="hidden" name="id" value={city.id} />
                          <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                            Eliminar
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cities.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    No hay ciudades creadas aún.
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
