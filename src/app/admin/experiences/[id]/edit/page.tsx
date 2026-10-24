import prisma from '@/lib/db';
import { requireAuth, isStaffOrAbove } from '@/lib/requireRole';
import { updateExperience } from '@/services/catalog/cms';
import { listCitiesByCountry } from '@/services/catalog/cities';
import { redirect } from 'next/navigation';
import { formatPrice } from '@/domain/entities/Money';
import { BackLink } from '@/components/BackLink';

interface EditExperiencePageProps {
  params: { id: string };
}

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const auth = await requireAuth();
  const id = params.id;
    if (!id || typeof id !== 'string') {
    redirect('/admin/experiences');
  }

  const exp = await prisma.experience.findUnique({
    where: { id },
    include: {
      operator: true,
      country: { select: { defaultCurrency: { select: { code: true } } } },
    },
  });

  if (!exp) {
    redirect('/admin/experiences');
  }

  if (!isStaffOrAbove(auth.role) && exp.operatorId !== auth.operatorId) {
    redirect('/admin/experiences');
  }

  if (!exp.countryId) {
    throw new Error(`Experience ${exp.id} has no countryId — run prisma/backfill-country.js`);
  }

  const currencyCode = exp.country?.defaultCurrency.code ?? 'COP';

  const [cities, categories] = await Promise.all([
    listCitiesByCountry(exp.countryId),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  async function updateExp(formData: FormData) {
    'use server';

    const authInAction = await requireAuth();

    const existing = await prisma.experience.findUnique({ where: { id } });

    if (!existing) return;

    if (
      !isStaffOrAbove(authInAction.role) &&
      existing.operatorId !== authInAction.operatorId
    ) {
      return;
    }

    // Antes: si no se elegia un archivo nuevo, "images" quedaba en [] y
    // updateExperience BORRABA las fotos existentes en cada guardado. Ahora
    // "images" se omite del update (undefined) cuando no hay archivo nuevo,
    // asi que las fotos existentes se conservan — igual criterio se aplica
    // a la foto del punto de encuentro.
    const file = formData.get('image');
    let images: string[] | undefined = undefined;
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
          images = [json.url];
        }
      }
    }

    const meetingPhotoFile = formData.get('meetingPointPhoto');
    let meetingPointPhoto: string | undefined = undefined;
    if (meetingPhotoFile && meetingPhotoFile instanceof File && meetingPhotoFile.size > 0) {
      const uploadData = new FormData();
      uploadData.append('file', meetingPhotoFile);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      if (res.ok) {
        const json = (await res.json()) as { url?: string };
        if (json.url) {
          meetingPointPhoto = json.url;
        }
      }
    }

    const meetingPointRaw = (formData.get('meetingPoint') as string) ?? '';

    // updateExperience valida server-side que la nueva cityId (si cambió)
    // pertenezca al mismo país que la experiencia — evita reasignarla a
    // una ciudad de otro país aunque el <select> haya sido manipulado.
    await updateExperience(
      id,
      {
        title: (formData.get('title') as string) ?? '',
        price: Number(formData.get('price')),
        cityId: (formData.get('cityId') as string) ?? '',
        categoryId: (formData.get('categoryId') as string) ?? '',
        ...(images !== undefined ? { images } : {}),
        meetingPoint: meetingPointRaw.trim() || null,
        ...(meetingPointPhoto !== undefined ? { meetingPointPhoto } : {}),
      },
      { userId: authInAction.userId, email: authInAction.email, role: authInAction.role },
    );

    redirect('/admin/experiences');
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <BackLink href="/admin/experiences" label="Experiencias" />
      <h1 className="mb-4 text-xl font-semibold">Editar experiencia</h1>
      <form action={updateExp} className="space-y-3" encType="multipart/form-data">
        <input
          name="title"
          defaultValue={exp.title}
          className="w-full rounded border px-2 py-2 text-sm"
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Precio ({currencyCode})
          </label>
          <input
            name="price"
            defaultValue={String(exp.price)}
            placeholder={formatPrice(0, currencyCode)}
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

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Foto de la experiencia {exp.images.length > 0 ? '(ya tiene una — subir una nueva la reemplaza)' : ''}
          </label>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="w-full rounded border px-2 py-2 text-sm"
          />
        </div>

        <div className="space-y-1 border-t pt-3 mt-1">
          <label className="block text-sm font-medium text-slate-700">
            Punto de encuentro (para el voucher del cliente)
          </label>
          <textarea
            name="meetingPoint"
            defaultValue={exp.meetingPoint ?? ''}
            placeholder="Ej: Muelle municipal, al lado de la caseta de informacion turistica"
            rows={2}
            className="w-full rounded border px-2 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Foto del punto de encuentro {exp.meetingPointPhoto ? '(ya tiene una — subir una nueva la reemplaza)' : '(opcional)'}
          </label>
          <input
            type="file"
            name="meetingPointPhoto"
            accept="image/*"
            className="w-full rounded border px-2 py-2 text-sm"
          />
        </div>

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
