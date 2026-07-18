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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categorías</h1>
      </div>

      <form action={addCategory} className="mb-6 flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700">Nueva categoría</label>
          <input
            name="name"
            placeholder="Ej. Aventura, Cultura, Gastronomía…"
            className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Crear
        </button>
      </form>

      <table className="w-full border text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="border px-2 py-1 text-left">Nombre</th>
            <th className="border px-2 py-1 text-left">Slug</th>
            <th className="border px-2 py-1 text-center">Experiencias</th>
            <th className="border px-2 py-1 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="border px-2 py-1">{c.name}</td>
              <td className="border px-2 py-1 text-slate-500">{c.slug}</td>
              <td className="border px-2 py-1 text-center">{c._count.experiences}</td>
              <td className="border px-2 py-1 text-center">
                {c._count.experiences === 0 ? (
                  <form action={removeCategory}>
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
              <td colSpan={4} className="px-3 py-4 text-center text-sm text-slate-500">
                No hay categorías creadas aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
