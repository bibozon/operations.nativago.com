import React, { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
  icon: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', icon: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCategories() {
    const res = await fetch('/api/categories');
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  }

  useEffect(() => { fetchCategories(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al crear categoría');
      setForm({ name: '', icon: '' });
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Categorías</h1>
      <form className="space-y-4 mb-8" onSubmit={handleSubmit}>
        <input className="w-full border rounded px-3 py-2" required placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" required placeholder="Icono" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
        {error && <div className="text-red-600">{error}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear categoría'}
        </button>
      </form>
      <ul className="divide-y divide-gray-200">
        {categories.map(cat => (
          <li key={cat.id} className="py-3 flex flex-col">
            <span className="font-medium text-gray-900">{cat.name}</span>
            <span className="text-gray-600 text-sm">{cat.icon}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
