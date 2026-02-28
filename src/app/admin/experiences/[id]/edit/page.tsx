import prisma from '@/lib/db';
import { requireAuth } from '@/lib/requireRole';
import { redirect } from 'next/navigation';

interface EditExperiencePageProps {
  params: { id: string };
}

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const auth = await requireAuth();
  const id = Number(params.id);

  if (!Number.isFinite(id)) {
    redirect('/admin/experiences');
  }

  const exp = await prisma.experience.findUnique({
    where: { id },
    include: { operator: true },
  });

  if (!exp) {
    redirect('/admin/experiences');
  }

  if (auth.role !== 'SUPERADMIN' && exp.operator?.userId !== auth.userId) {
    redirect('/admin/experiences');
  }

  const [cities, categories] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  async function updateExp(formData: FormData) {
    'use server';

    const authInAction = await requireAuth();

    const existing = await prisma.experience.findUnique({
      where: { id },
      include: { operator: true },
    });

    if (!existing) return;

    if (
      authInAction.role !== 'SUPERADMIN' &&
      existing.operator?.userId !== authInAction.userId
    ) {
      return;
    }

    const file = formData.get('image');

    let imageUrl: string | null = null;

    if (file && file instanceof File && file.size > 0) {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (res.ok) {
        const json = (await res.json()) as { url?: string };
        if (json.url) {
          imageUrl = json.url;
        }
      }
    }

    const data: Record<string, unknown> = {
      title: (formData.get('title') as string) ?? '',
      price: Number(formData.get('price')),
      cityId: Number(formData.get('cityId')),
      categoryId: Number(formData.get('categoryId')),
    };

    if (imageUrl) {
      data.image = imageUrl;
    }

    await prisma.experience.update({
      where: { id },
      data,
    });

    redirect('/admin/experiences');
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Editar experiencia</h1>
      <form action={updateExp} className="space-y-3" encType="multipart/form-data">
        <input
          name="title"
          defaultValue={exp.title}
          className="w-full rounded border px-2 py-2 text-sm"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Preço (R$)
          </label>
          <input
            name="price"
            defaultValue={String(exp.price)}
            placeholder="R$ 0,00"
            className="w-full rounded border p-2 text-sm"
          />
        </div>

        <select
          name="cityId"
          defaultValue={exp.cityId}
          className="w-full rounded border px-2 py-2 text-sm"
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          name="categoryId"
          defaultValue={exp.categoryId}
          className="w-full rounded border px-2 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="file"
          name="image"
          accept="image/*"
          className="w-full rounded border px-2 py-2 text-sm"
        />

        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
