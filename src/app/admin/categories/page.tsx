import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';
import { createCategory } from '@/services/catalog/cms';
import { deleteCategoryIfUnused } from '@/services/catalog/categories';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  await requireSuperadmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { experiences: true } } },
  });

  async function addCategory(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const name = ((formData.get('name') as string) ?? '').trim();
    if (!name) return;

    await createCategory({ name, slug: slugify(name) });
    revalidatePath('/admin/categories');
  }

  async function updateDepositRate(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const id = (formData.get('id') as string) ?? '';
    const raw = Number(formData.get('depositRate'));
    if (!id || isNaN(raw)) return;

    const rate = Math.min(0.5, Math.max(0.15, raw / 100));
    await prisma.category.update({ where: { id }, data: { depositRate: rate } });
    revalidatePath('/admin/categories');
  }

  async function removeCategory(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const id = (formData.get('id') as string) ?? '';
    if (!id) return;

    // El botón ya se oculta si está en uso, pero la Server Action es
    // invocable directamente sin pasar por la UI (POST forzado) — sin este
    // try/catch, deleteCategoryIfUnused() propaga un error no controlado.
    try {
      await deleteCategoryIfUnused(id);
    } catch {
      redirect('/admin/categories?error=in-use');
    }
    revalidatePath('/admin/categories');
  }

  return (
    <div>
      {searchParams?.error === 'in-use' && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No se puede eliminar: esta categoría está en uso por experiencias.
        </div>
      )}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Categorías</h1>
        <p className="mt-1 text-sm text-slate-500">
          Taxonomía de experiencias visible en todo el marketplace.
        </p>
      </header>

      <form action={addCategory} className="mb-6 flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600">Nueva categoría</label>
          <input
            name="name"
            placeholder="Ej. Aventura, Cultura, Gastronomía…"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
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
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">% Anticipo</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Experiencias</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.slug}</td>
                  <td className="px-4 py-2.5 text-center">
                    <form action={updateDepositRate} className="inline-flex items-center gap-1.5">
                      <input type="hidden" name="id" value={c.id} />
                      <select
                        name="depositRate"
                        defaultValue={Math.round((c.depositRate ?? 0.15) * 100)}
                        className="rounded border border-slate-200 text-xs px-1.5 py-1 bg-white text-slate-700 focus:outline-none focus:border-teal-400"
                      >
                        {[15, 20, 25, 30, 35, 40, 45, 50].map(p => (
                          <option key={p} value={p}>{p}%</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-[10px] font-semibold text-teal-600 hover:underline"
                      >
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2.5 text-center text-slate-900">{c._count.experiences}</td>
                  <td className="px-4 py-2.5 text-right">
                    {c._count.experiences === 0 ? (
                      <form action={removeCategory} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          Eliminar
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-slate-400" title="No se puede eliminar: en uso por experiencias">
                        En uso
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    No hay categorías creadas aún.
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
