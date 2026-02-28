import prisma from '@/lib/db';
import { requireOperator } from '@/lib/requireRole';
import { redirect } from 'next/navigation';

export default async function NewExperiencePage() {
  const auth = await requireOperator();

  const operator = await prisma.operator.findFirst({
    where: { userId: auth.userId },
  });

  const [cities, categories] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  async function createExp(formData: FormData) {
    'use server';

    const auth = await requireOperator();

    const title = (formData.get('title') as string) ?? '';
    const description = (formData.get('description') as string) ?? '';
    const durationMinutes = Number(formData.get('durationMinutes'));
    const price = Number(formData.get('price'));
    const cityId = Number(formData.get('cityId'));
    const categoryId = Number(formData.get('categoryId'));
    const file = formData.get('image');

    if (!title || !description || !Number.isFinite(durationMinutes) || !Number.isFinite(price) || !cityId || !categoryId) {
      return;
    }

    const operator = await prisma.operator.findFirst({
      where: { userId: auth.userId },
    });

    if (!operator) {
      throw new Error('Operator not found');
    }

    if (operator.verificationStatus !== 'APPROVED') {
      throw new Error('Operator not verified');
    }

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

    await prisma.experience.create({
      data: {
        title,
        description,
        durationMinutes,
        price,
        cityId,
        categoryId,
        operatorId: operator.id,
        images: imageUrl ? [imageUrl] : [],
      },
    });

    redirect('/admin/experiences');
  }

  if (!operator || operator.verificationStatus !== 'APPROVED') {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-4 text-xl font-semibold">Crear experiencia</h1>
        <p className="text-sm text-slate-600">
          Tu cuenta de operador aún no ha sido verificada. Solo los operadores
          aprobados pueden crear y publicar experiencias.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Crear experiencia</h1>
      <form action={createExp} className="space-y-3" encType="multipart/form-data">
        <input
          name="title"
          placeholder="Título"
          className="w-full rounded border px-2 py-2 text-sm"
        />

        <textarea
          name="description"
          placeholder="Descripción de la experiencia"
          className="w-full rounded border px-2 py-2 text-sm"
        />

        <input
          type="number"
          name="durationMinutes"
          placeholder="Duración en minutos"
          className="w-full rounded border px-2 py-2 text-sm"
          min={1}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Preço (R$)
          </label>
          <input
            name="price"
            placeholder="R$ 0,00"
            className="w-full rounded border p-2 text-sm"
            type="number"
            min={0}
            step={0.01}
          />
        </div>

        <select name="cityId" className="w-full rounded border px-2 py-2 text-sm">
          <option value="">Selecciona una ciudad</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select name="categoryId" className="w-full rounded border px-2 py-2 text-sm">
          <option value="">Selecciona una categoría</option>
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
          Crear experiencia
        </button>
      </form>
    </div>
  );
}
