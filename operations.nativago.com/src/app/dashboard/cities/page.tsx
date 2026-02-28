import React, { useEffect, useState } from 'react';

interface City {
  id: number;
  name: string;
  country: string;
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({ name: '', country: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCities() {
    const res = await fetch('/api/cities');
    if (res.ok) {
      const data = await res.json();
      setCities(data);
    }
  }

  useEffect(() => { fetchCities(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al crear ciudad');
      setForm({ name: '', country: '' });
      fetchCities();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ciudades</h1>
      <form className="space-y-4 mb-8" onSubmit={handleSubmit}>
        <input className="w-full border rounded px-3 py-2" required placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="w-full border rounded px-3 py-2" required placeholder="País" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
        {error && <div className="text-red-600">{error}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear ciudad'}
        </button>
      </form>
      <ul className="divide-y divide-gray-200">
        {cities.map(city => (
          <li key={city.id} className="py-3 flex flex-col">
            <span className="font-medium text-gray-900">{city.name}</span>
            <span className="text-gray-600 text-sm">{city.country}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
