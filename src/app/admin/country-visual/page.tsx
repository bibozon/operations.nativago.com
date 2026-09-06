import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireSuperadmin } from '@/lib/requireRole';

type SlideTypeValue = 'HERO' | 'PHOTO_SLIDER' | 'DESTINATION';

const TYPE_LABELS: Record<SlideTypeValue, string> = {
  HERO: 'Hero slider',
  PHOTO_SLIDER: 'Fotos icónicas',
  DESTINATION: 'Destinos / Ciudades',
};

const TYPE_HINTS: Record<SlideTypeValue, string> = {
  HERO: 'Imagen de fondo del hero (1400px ancho). Título = nombre de ciudad.',
  PHOTO_SLIDER: 'Carrusel "Lugares icónicos". Título = lugar, Subtítulo = región.',
  DESTINATION: 'Tarjetas de ciudad. Título = nombre exacto de ciudad (debe coincidir con CMS). Emoji = ícono.',
};

export default async function CountryVisualPage({
  searchParams,
}: {
  searchParams?: { country?: string; type?: string };
}) {
  await requireSuperadmin();

  const countries = await prisma.country.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, domainSlug: true, code: true },
  });

  const selectedCountrySlug = searchParams?.country ?? countries[0]?.domainSlug ?? '';
  const selectedType = (searchParams?.type ?? 'HERO') as SlideTypeValue;

  const selectedCountry = countries.find(c => c.domainSlug === selectedCountrySlug);

  const slides = selectedCountry
    ? await prisma.countrySlide.findMany({
        where: { countryId: selectedCountry.id, type: selectedType },
        orderBy: { sortOrder: 'asc' },
      })
    : [];

  // ── Server Actions ─────────────────────────────────────────────────────────

  async function addSlide(formData: FormData) {
    'use server';
    await requireSuperadmin();

    const countryId = (formData.get('countryId') as string) ?? '';
    const type = (formData.get('type') as SlideTypeValue) ?? 'HERO';
    const imageUrl = ((formData.get('imageUrl') as string) ?? '').trim();
    const title = ((formData.get('title') as string) ?? '').trim();
    const subtitle = ((formData.get('subtitle') as string) ?? '').trim() || null;
    const emoji = ((formData.get('emoji') as string) ?? '').trim() || null;
    const sortOrder = Number(formData.get('sortOrder') ?? 0);

    if (!countryId || !imageUrl || !title) return;

    await prisma.countrySlide.create({
      data: { countryId, type, imageUrl, title, subtitle, emoji, sortOrder },
    });
    revalidatePath('/admin/country-visual');
  }

  async function toggleActive(formData: FormData) {
    'use server';
    await requireSuperadmin();
    const id = (formData.get('id') as string) ?? '';
    const current = formData.get('isActive') === 'true';
    if (!id) return;
    await prisma.countrySlide.update({ where: { id }, data: { isActive: !current } });
    revalidatePath('/admin/country-visual');
  }

  async function updateSortOrder(formData: FormData) {
    'use server';
    await requireSuperadmin();
    const id = (formData.get('id') as string) ?? '';
    const order = Number(formData.get('sortOrder') ?? 0);
    if (!id) return;
    await prisma.countrySlide.update({ where: { id }, data: { sortOrder: order } });
    revalidatePath('/admin/country-visual');
  }

  async function deleteSlide(formData: FormData) {
    'use server';
    await requireSuperadmin();
    const id = (formData.get('id') as string) ?? '';
    if (!id) return;
    await prisma.countrySlide.delete({ where: { id } });
    revalidatePath('/admin/country-visual');
  }

  async function changeView(formData: FormData) {
    'use server';
    const country = (formData.get('country') as string) ?? '';
    const type = (formData.get('type') as string) ?? 'HERO';
    redirect(`/admin/country-visual?country=${country}&type=${type}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Visual por País</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona los slides del hero, fotos icónicas y tarjetas de destino para cada país del marketplace.
        </p>
      </header>

      {/* Country + Type selector */}
      <form action={changeView} className="mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">País</label>
          <select
            name="country"
            defaultValue={selectedCountrySlug}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
          >
            {countries.map(c => (
              <option key={c.id} value={c.domainSlug}>
                {c.name} ({c.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de slide</label>
          <select
            name="type"
            defaultValue={selectedType}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none"
          >
            {(Object.keys(TYPE_LABELS) as SlideTypeValue[]).map(t => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
        >
          Ver
        </button>
      </form>

      {selectedCountry && (
        <>
          {/* Hint */}
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-xs text-blue-700">
            <strong>{TYPE_LABELS[selectedType]}:</strong> {TYPE_HINTS[selectedType]}
          </div>

          {/* Add new slide */}
          <form
            action={addSlide}
            className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm space-y-3"
          >
            <h2 className="text-sm font-semibold text-slate-700">Agregar slide</h2>
            <input type="hidden" name="countryId" value={selectedCountry.id} />
            <input type="hidden" name="type" value={selectedType} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">URL de imagen *</label>
                <input
                  name="imageUrl"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Título *</label>
                <input
                  name="title"
                  required
                  placeholder={selectedType === 'HERO' ? 'Bogotá' : selectedType === 'PHOTO_SLIDER' ? 'Parque Tayrona' : 'Cartagena'}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              {selectedType === 'PHOTO_SLIDER' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600">Subtítulo / Región</label>
                  <input
                    name="subtitle"
                    placeholder="Santa Marta"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              )}
              {selectedType === 'DESTINATION' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600">Emoji</label>
                  <input
                    name="emoji"
                    placeholder="🏖️"
                    maxLength={4}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600">Orden</label>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={slides.length}
                  min={0}
                  className="mt-1 w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
            >
              Agregar
            </button>
          </form>

          {/* Slides table */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Título</th>
                    {selectedType === 'PHOTO_SLIDER' && (
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Subtítulo</th>
                    )}
                    {selectedType === 'DESTINATION' && (
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Emoji</th>
                    )}
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Orden</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Activo</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {slides.map(slide => (
                    <tr key={slide.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="w-20 h-12 object-cover rounded-lg bg-slate-100"
                          onError={() => {}}
                        />
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900 max-w-[200px] truncate">
                        {slide.title}
                      </td>
                      {selectedType === 'PHOTO_SLIDER' && (
                        <td className="px-4 py-2.5 text-slate-500">{slide.subtitle ?? '—'}</td>
                      )}
                      {selectedType === 'DESTINATION' && (
                        <td className="px-4 py-2.5 text-center text-lg">{slide.emoji ?? '—'}</td>
                      )}
                      <td className="px-4 py-2.5 text-center">
                        <form action={updateSortOrder} className="inline-flex items-center gap-1">
                          <input type="hidden" name="id" value={slide.id} />
                          <input
                            name="sortOrder"
                            type="number"
                            defaultValue={slide.sortOrder}
                            min={0}
                            className="w-14 rounded border border-slate-200 text-xs px-1.5 py-1 text-center"
                          />
                          <button type="submit" className="text-[10px] font-semibold text-teal-600 hover:underline">
                            OK
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <form action={toggleActive} className="inline">
                          <input type="hidden" name="id" value={slide.id} />
                          <input type="hidden" name="isActive" value={String(slide.isActive)} />
                          <button
                            type="submit"
                            className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                              slide.isActive
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {slide.isActive ? 'Activo' : 'Inactivo'}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <form action={deleteSlide} className="inline">
                          <input type="hidden" name="id" value={slide.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {slides.length === 0 && (
                    <tr>
                      <td
                        colSpan={selectedType === 'HERO' ? 5 : 6}
                        className="px-4 py-8 text-center text-sm text-slate-400"
                      >

                        No hay slides de tipo "{TYPE_LABELS[selectedType]}" para {selectedCountry.name}. Agrega el primero arriba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
