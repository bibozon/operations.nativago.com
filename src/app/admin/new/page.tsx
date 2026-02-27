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
  const [image, setImage] = useState('');
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
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">New Experience</h1>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600">Title</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Price (COP)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Duration (minutes)</label>
              <input
                type="number"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Image URL</label>
              <input
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Category</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">City</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
              >
                <option value="">Select…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Operator</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-600 focus:outline-none"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
              >
                <option value="">Select…</option>
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="featured" className="text-sm text-slate-700">
              Featured on marketplace home
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Create experience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
