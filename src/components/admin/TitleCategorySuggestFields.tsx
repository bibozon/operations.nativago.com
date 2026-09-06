'use client';

import { useEffect, useState } from 'react';
import { suggestCategoryId } from '@/lib/categorySuggestion';

type Option = { id: string; name: string };

export function TitleCategorySuggestFields({ categories }: { categories: Option[] }) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [categorySuggested, setCategorySuggested] = useState(false);

  // Sugiere categoría según el título mientras no se haya elegido una a
  // mano — reconoce palabras clave en ES/EN/PT/FR (ver
  // src/lib/categorySuggestion.ts), sin depender de ningún servicio de IA.
  useEffect(() => {
    if (categoryTouched || categories.length === 0) return;
    const suggested = suggestCategoryId(title, categories);
    if (suggested) {
      setCategoryId(suggested);
      setCategorySuggested(true);
    }
  }, [title, categories, categoryTouched]);

  return (
    <>
      <input
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        className="w-full rounded border px-2 py-2 text-sm"
      />

      <div>
        {categorySuggested && (
          <p className="mb-1 text-xs font-medium text-emerald-700">
            Categoría sugerida según el título — podés cambiarla.
          </p>
        )}
        <select
          name="categoryId"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setCategoryTouched(true);
            setCategorySuggested(false);
          }}
          className="w-full rounded border px-2 py-2 text-sm"
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
