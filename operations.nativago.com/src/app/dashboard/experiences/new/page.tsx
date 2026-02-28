import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface City { id: number; name: string; }
interface Category { id: number; name: string; }

export default function NewExperiencePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', price: '', durationMinutes: '', capacity: '',
    images: '', coveragePolicy: '', coverageDescription: '',
    operatorId: '', cityId: '', categoryId: ''
  });
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      const res = await fetch('/api/cities');
      if (res.ok) {
        const data = await res.json();
        setCities(data);
      }
    }
    async function fetchCategories() {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    }
    fetchCities();
    fetchCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          durationMinutes: Number(form.durationMinutes),
          capacity: Number(form.capacity),
          images: form.images.split(',').map(s => s.trim()),
        }),
      });
      if (!res.ok) throw new Error('Error al crear experiencia');
      router.push('/dashboard/experiences');
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nueva Experiencia</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input className="w-full border rounded px-3 py-2" required placeholder="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <textarea className="w-full border rounded px-3 py-2" required placeholder="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" required type="number" placeholder="Precio" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" required type="number" placeholder="Duración (minutos)" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" required type="number" placeholder="Capacidad" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" placeholder="Imágenes (URLs separadas por coma)" value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" placeholder="Política de cobertura" value={form.coveragePolicy} onChange={e => setForm(f => ({ ...f, coveragePolicy: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" placeholder="Descripción de cobertura" value={form.coverageDescription} onChange={e => setForm(f => ({ ...f, coverageDescription: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" required placeholder="ID Operador" value={form.operatorId} onChange={e => setForm(f => ({ ...f, operatorId: e.target.value }))} />
        <select className="w-full border rounded px-3 py-2" required value={form.cityId} onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))}>
          <option value="">Selecciona una ciudad</option>
          {cities.map(city => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
        <select className="w-full border rounded px-3 py-2" required value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
          <option value="">Selecciona una categoría</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {error && <div className="text-red-600">{error}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear experiencia'}
        </button>
      </form>
    </main>
  );
}
