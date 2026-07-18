import { revalidatePath } from 'next/cache';
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

export default async function CategoriesPage() {
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

  async function removeCategory(formData: FormData) {
    'use server';

    await requireSuperadmin();

    const id = (formData.get('id') as string) ?? '';
    if (!id) return;

    await deleteCategoryIfUnused(id);
    revalidatePath('/admin/categories');
  }

  return (
    <div>
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
                <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Experiencias</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.slug}</td>
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
