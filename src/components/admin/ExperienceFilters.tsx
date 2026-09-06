'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type Option = { id: string; name: string };

interface Props {
  categories: Option[];
  countries: Option[];
  cities: Option[];
  labels: { category: string; country: string; city: string; clear: string };
}

export function ExperienceFilters({ categories, countries, cities, labels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Cambiar de país invalida la ciudad elegida — ya no aplicaría el filtro.
    if (key === 'countryId') params.delete('cityId');
    router.push(`/admin/experiences?${params.toString()}`);
  }

  const hasFilters = searchParams.has('categoryId') || searchParams.has('countryId') || searchParams.has('cityId');

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get('categoryId') ?? ''}
        onChange={(e) => setParam('categoryId', e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      >
        <option value="">{labels.category}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={searchParams.get('countryId') ?? ''}
        onChange={(e) => setParam('countryId', e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      >
        <option value="">{labels.country}</option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={searchParams.get('cityId') ?? ''}
        onChange={(e) => setParam('cityId', e.target.value)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
      >
        <option value="">{labels.city}</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push('/admin/experiences')}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
        >
          {labels.clear}
        </button>
      )}
    </div>
  );
}
