import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';
import { deleteCityIfUnused } from '@/services/catalog/cities';

export default async function CitiesPage() {
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

    await deleteCityIfUnused(id);
    revalidatePath('/admin/cities');
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cities</h1>
      </div>

      <form action={addCity} className="mb-6 flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">Nueva ciudad</label>
          <input
            name="name"
            placeholder="Ej. Medellín"
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">País</label>
          <select name="countryId" className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm">
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
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Crear
        </button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full border rounded-xl">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Ciudad</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">País</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Experiencias / Operadores</th>
              <th className="px-4 py-2 text-left text-xs text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cities.map((city) => {
              const inUse = city._count.experiences > 0 || city._count.operators > 0;
              return (
                <tr key={city.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">{city.name}</td>
                  <td className="px-4 py-2 text-slate-600">{city.countryRef?.name ?? city.country}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {city._count.experiences} / {city._count.operators}
                  </td>
                  <td className="px-4 py-2">
                    {inUse ? (
                      <span className="text-xs text-slate-400" title="No se puede eliminar: en uso">
                        En uso
                      </span>
                    ) : (
                      <form action={removeCity}>
                        <input type="hidden" name="id" value={city.id} />
                        <button type="submit" className="text-red-600 hover:underline text-xs font-medium">
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
    </div>
  );
}
