'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Option = { id: number; name: string };

export default function NewExperiencePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [capacity, setCapacity] = useState('');
  const [image, setImage] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [featured, setFeatured] = useState(true);

  const [categories, setCategories] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [operators, setOperators] = useState<Option[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOptions() {
    try {
      setError(null);

      const [catRes, cityRes, opRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch('/api/catalog/cities'),
        fetch('/api/catalog/operator'),
      ]);

      const [catData, cityData, opData] = await Promise.all([
        catRes.json(),
        cityRes.json(),
        opRes.json(),
      ]);

      setCategories(Array.isArray(catData) ? catData : []);
      setCities(Array.isArray(cityData) ? cityData : []);
      setOperators(Array.isArray(opData) ? opData : []);
    } catch (err) {
      console.error('NewExperience loadOptions failed', err);
      setError('Error cargando catálogos');
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !price || !durationMinutes || !categoryId || !cityId || !operatorId) {
      setError('Todos los campos obligatorios deben estar completos');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/catalog/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          durationMinutes: Number(durationMinutes),
          image: image || undefined,
          capacity: capacity ? Number(capacity) : undefined,
          featured,
          categoryId: Number(categoryId),
          cityId: Number(cityId),
          operatorId: Number(operatorId),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Error creando experiencia');
      }

      router.push('/admin');
    } catch (err) {
      console.error('NewExperience submit failed', err);
      setError(err instanceof Error ? err.message : 'Error creando experiencia');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-shrink-0 border-r border-slate-200 bg-white/90 px-4 py-6 shadow-sm md:block">
          <div className="mb-6 flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              NG
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">NativaGo</p>
              <p className="text-xs text-slate-500">CMS Admin</p>
            </div>
          </div>

          <nav className="space-y-1 text-sm">
            <a
              href="/admin"
              className="flex items-center rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Experiencias
            </a>
            <a
              href="/admin/new"
              className="mt-1 flex items-center rounded-lg bg-emerald-50 px-3 py-2 font-medium text-emerald-700"
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Crear experiencia
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-4xl">
            <header className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Crear experiencia
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Publica nuevas experiencias turísticas en el marketplace de NativaGo.
              </p>
            </header>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Título</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tour, experiencia o actividad"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Descripción</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cuenta la historia de la experiencia, qué incluye y a quién va dirigida."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Categoría</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Ciudad</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Precio (COP)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="180000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Duración (minutos)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    placeholder="180"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Cupo</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Número máximo de participantes"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600">Imagen principal (URL)</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://…"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600">
                    Galería de imágenes
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-1 w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                    onChange={(e) => setGalleryFiles(e.target.files)}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Las imágenes se utilizarán como galería visual de la experiencia.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600">Operador</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {operators.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="featured" className="text-sm text-slate-700">
                    Destacado en el home del marketplace
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
                >
                  {loading ? 'Guardando…' : 'Guardar experiencia'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
